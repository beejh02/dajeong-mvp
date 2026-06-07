import type {
  MenuItem,
  MenuListResponse,
  MenuOptionChoice,
  MenuOptionGroup,
} from "../../../lib/api/types";
import type {
  BuildOrderDraftResult,
  OrderDraftSelectedOptionGroup,
  ParsedOrderIntent,
} from "../types";

const OPTION_CHOICE_ALIASES: Record<string, string> = {
  "번 굽기": "bun-toasted",
  일반: "bun-normal",
  제로콜라: "drink-zero-coke",
  "콜라 L": "drink-coke-l",
  콜라: "drink-coke-r",
  감자튀김: "side-fries-r",
};

function normalizeForSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function getMenuCandidates(menuKeyword: string | null, menus: MenuItem[]) {
  if (!menuKeyword) return [];

  const normalizedKeyword = normalizeForSearch(menuKeyword);

  return menus.filter((menu) => {
    return (
      menu.isAvailable &&
      normalizeForSearch(menu.name).includes(normalizedKeyword)
    );
  });
}

function getChoiceByKeyword(
  group: MenuOptionGroup,
  optionKeyword: string,
): MenuOptionChoice | null {
  const aliasedChoiceId = OPTION_CHOICE_ALIASES[optionKeyword];

  if (aliasedChoiceId) {
    const aliasedChoice = group.choices.find(
      (choice) => choice.id === aliasedChoiceId,
    );

    if (aliasedChoice) return aliasedChoice;
  }

  const normalizedKeyword = normalizeForSearch(optionKeyword);

  return (
    group.choices.find((choice) =>
      normalizeForSearch(choice.name).includes(normalizedKeyword),
    ) ?? null
  );
}

function selectOptionGroups(
  menu: MenuItem,
  optionKeywords: string[],
): OrderDraftSelectedOptionGroup[] {
  return menu.optionGroups.flatMap((group) => {
    const selectedChoices: MenuOptionChoice[] = [];

    for (const keyword of optionKeywords) {
      const choice = getChoiceByKeyword(group, keyword);

      if (!choice || selectedChoices.some((selected) => selected.id === choice.id)) {
        continue;
      }

      selectedChoices.push(choice);

      if (group.selectionMode === "single") {
        break;
      }

      if (group.maxSelect > 0 && selectedChoices.length >= group.maxSelect) {
        break;
      }
    }

    if (selectedChoices.length === 0) return [];

    return [
      {
        groupId: group.id,
        groupTitle: group.title,
        choiceIds: selectedChoices.map((choice) => choice.id),
        choiceNames: selectedChoices.map((choice) => choice.name),
      },
    ];
  });
}

function findMissingRequiredGroup(
  menu: MenuItem,
  selectedOptionGroups: OrderDraftSelectedOptionGroup[],
) {
  const selectedCountByGroup = new Map(
    selectedOptionGroups.map((group) => [group.groupId, group.choiceIds.length]),
  );

  return menu.optionGroups.find((group) => {
    const selectedCount = selectedCountByGroup.get(group.id) ?? 0;

    return (
      (group.required && selectedCount === 0) ||
      selectedCount < group.minSelect
    );
  });
}

function hasFinalConsonant(value: string) {
  const lastCharacter = value.trim().at(-1);

  if (!lastCharacter) return false;

  const code = lastCharacter.charCodeAt(0) - 0xac00;

  return code >= 0 && code <= 11171 && code % 28 !== 0;
}

function withDirectionParticle(value: string) {
  return `${value}${hasFinalConsonant(value) ? "으로" : "로"}`;
}

function getChoiceQuestionLabel(group: MenuOptionGroup, choice: MenuOptionChoice) {
  if (group.title.includes("번") && choice.name === "일반") {
    return "일반 번";
  }

  return choice.name;
}

function getMissingRequiredMessage(group: MenuOptionGroup) {
  const labels = group.choices
    .slice(0, 2)
    .map((choice) => getChoiceQuestionLabel(group, choice));

  if (labels.length >= 2) {
    return `${group.title}이 필요합니다. ${withDirectionParticle(
      labels[0],
    )} 할까요, ${withDirectionParticle(labels[1])} 할까요?`;
  }

  if (labels.length === 1) {
    return `${group.title}이 필요합니다. ${withDirectionParticle(
      labels[0],
    )} 선택할까요?`;
  }

  return `${group.title}이 필요합니다. 선택 가능한 옵션을 확인해 주세요.`;
}

function getTotalPrice(
  menu: MenuItem,
  selectedOptionGroups: OrderDraftSelectedOptionGroup[],
  quantity: number,
) {
  const selectedChoiceIds = new Set(
    selectedOptionGroups.flatMap((group) => group.choiceIds),
  );
  const optionPrice = menu.optionGroups
    .flatMap((group) => group.choices)
    .filter((choice) => selectedChoiceIds.has(choice.id))
    .reduce((sum, choice) => sum + choice.priceDelta, 0);

  return (menu.price + optionPrice) * quantity;
}

export function buildOrderDraft(
  intent: ParsedOrderIntent,
  menuResponse: MenuListResponse,
): BuildOrderDraftResult {
  if (!intent.companyId) {
    return {
      status: "missing_company",
      message: "A기업과 B기업 중 어디에서 주문할까요?",
    };
  }

  const candidates = getMenuCandidates(intent.menuKeyword, menuResponse.menus);

  if (candidates.length === 0) {
    return {
      status: "missing_menu",
      message: "주문할 메뉴를 찾지 못했습니다. 다시 입력해 주세요.",
    };
  }

  if (candidates.length > 1) {
    const candidateNames = candidates.map((menu) => menu.name).join(", ");

    return {
      status: "ambiguous_menu",
      message: `주문할 메뉴를 하나만 선택해 주세요. 후보: ${candidateNames}`,
      candidates,
    };
  }

  const menu = candidates[0];
  const selectedOptionGroups = selectOptionGroups(menu, intent.optionKeywords);
  const missingRequiredGroup = findMissingRequiredGroup(
    menu,
    selectedOptionGroups,
  );

  if (missingRequiredGroup) {
    return {
      status: "missing_required_options",
      message: getMissingRequiredMessage(missingRequiredGroup),
      menu,
    };
  }

  return {
    status: "ready",
    message: "주문 초안을 만들었습니다. 내용을 확인한 뒤 주문을 확정해 주세요.",
    draft: {
      companyId: menuResponse.company.id,
      companyName: menuResponse.company.name,
      menuId: menu.id,
      menuName: menu.name,
      quantity: intent.quantity,
      selectedOptionGroups,
      fulfillmentType: intent.fulfillmentType,
      paymentMethod: intent.paymentMethod,
      pointAccrual: intent.pointAccrual,
      totalPrice: getTotalPrice(menu, selectedOptionGroups, intent.quantity),
    },
  };
}
