import type { MenuCategory } from "./types";
import firstHamburgerImage from "../../assets/firstHamburger.gif";
import krabbyPattyImage from "../../assets/krabby_patty.jpg";
import hambugiImage from "../../assets/hambugi.png";

export const menuData: MenuCategory[] = [
  {
    id: "category-burger",
    title: "버거 메뉴",
    icon: "🍔",
    label: "버거",
    items: [
      {
        id: "burger-dancing",
        name: "춤추는 버거",
        description: "불향 패티와 달콤한 특제 소스",
        price: 7900,
        img: firstHamburgerImage.src,
        badge: "BEST",
      },
      {
        id: "burger-krabby",
        name: "집게버거",
        description: "두툼한 패티와 신선한 야채",
        price: 8500,
        img: krabbyPattyImage.src,
      },
      {
        id: "burger-hambugi",
        name: "햄부기햄북",
        description: "가볍게 먹기 좋은 기본 버거",
        price: 6900,
        img: hambugiImage.src,
      },
      {
        id: "burger-cheese",
        name: "치즈킹 버거",
        description: "진한 체다치즈와 고소한 패티",
        price: 8200,
        img: "",
        badge: "NEW",
      },
      {
        id: "burger-fire",
        name: "불타는 와퍼",
        description: "매콤한 소스와 그릴드 패티",
        price: 8900,
        img: "",
      },
    ],
  },
  {
    id: "category-side",
    title: "사이드 메뉴",
    icon: "🍟",
    label: "사이드",
    items: [
      {
        id: "side-fries",
        name: "흔들흔들 감자",
        description: "시즈닝을 넣고 흔들어 먹는 감자튀김",
        price: 2500,
        img: "",
        badge: "추천",
      },
      {
        id: "side-cheese-stick",
        name: "치즈 폭발 스틱",
        description: "쭉 늘어나는 모짜렐라 치즈",
        price: 3000,
        img: "",
      },
      {
        id: "side-onion",
        name: "어니언 링링",
        description: "바삭하게 튀긴 양파링",
        price: 2800,
        img: "",
      },
      {
        id: "side-nugget",
        name: "바삭 치킨너겟",
        description: "한입 크기 치킨 너겟 6조각",
        price: 3500,
        img: "",
      },
    ],
  },
  {
    id: "category-drink",
    title: "음료 메뉴",
    icon: "🥤",
    label: "음료",
    items: [
      {
        id: "drink-cola",
        name: "콜라",
        description: "버거와 잘 어울리는 기본 탄산음료",
        price: 2000,
        img: "",
      },
      {
        id: "drink-zero",
        name: "제로 콜라",
        description: "당 부담 없이 즐기는 탄산음료",
        price: 2000,
        img: "",
        badge: "ZERO",
      },
      {
        id: "drink-ade",
        name: "레몬 에이드",
        description: "상큼한 레몬향 에이드",
        price: 3200,
        img: "",
      },
      {
        id: "drink-coffee",
        name: "아이스 아메리카노",
        description: "깔끔하고 진한 아이스 커피",
        price: 2800,
        img: "",
      },
    ],
  },
  {
    id: "category-dessert",
    title: "디저트 메뉴",
    icon: "🍦",
    label: "디저트",
    items: [
      {
        id: "dessert-icecream",
        name: "소프트 아이스크림",
        description: "부드럽고 달콤한 기본 아이스크림",
        price: 1800,
        img: "",
      },
      {
        id: "dessert-cookie",
        name: "왕초코 쿠키",
        description: "진한 초코칩이 들어간 쿠키",
        price: 2200,
        img: "",
        badge: "달콤",
      },
      {
        id: "dessert-pie",
        name: "초코 파이",
        description: "따뜻하게 먹기 좋은 초코 디저트",
        price: 2500,
        img: "",
      },
    ],
  },
];

export const formatPrice = (price: number) => price.toLocaleString("ko-KR");
