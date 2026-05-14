from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="user")
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)

    profile: Mapped["UserProfile"] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
    )
    preferences: Mapped[list["Preference"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"), primary_key=True)
    age_group: Mapped[str | None] = mapped_column(String(32), nullable=True)
    communication_mode: Mapped[str] = mapped_column(String(32), nullable=False, default="text")
    easy_mode_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    demo_contact_label: Mapped[str | None] = mapped_column(String(120), nullable=True)

    user: Mapped[User] = relationship(back_populates="profile")


class Preference(Base):
    __tablename__ = "preferences"

    preference_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"), nullable=False, index=True)
    preference_type: Mapped[str] = mapped_column(String(64), nullable=False)
    ingredient_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    user: Mapped[User] = relationship(back_populates="preferences")


class MenuItem(Base):
    __tablename__ = "menu_items"

    menu_item_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    brand_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    store_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    options_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")

    ingredients: Mapped[list["MenuIngredient"]] = relationship(
        back_populates="menu_item",
        cascade="all, delete-orphan",
        order_by="MenuIngredient.id",
    )


class MenuIngredient(Base):
    __tablename__ = "menu_ingredients"
    __table_args__ = (
        UniqueConstraint("menu_item_id", "ingredient_id", name="uq_menu_ingredient"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    menu_item_id: Mapped[str] = mapped_column(
        ForeignKey("menu_items.menu_item_id"),
        nullable=False,
        index=True,
    )
    ingredient_id: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    removable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    menu_item: Mapped[MenuItem] = relationship(back_populates="ingredients")
