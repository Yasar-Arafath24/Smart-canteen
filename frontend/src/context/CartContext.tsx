import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { MenuItem } from "../api/menu";

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: number) => void;
  increaseQuantity: (itemId: number) => void;
  decreaseQuantity: (itemId: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(
  undefined,
);

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);

  function addToCart(item: MenuItem) {
    setItems((currentItems) => {
      const existing = currentItems.find(
        (cartItem) => cartItem.item.id === item.id,
      );

      if (existing) {
        return currentItems.map((cartItem) =>
          cartItem.item.id === item.id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
              }
            : cartItem,
        );
      }

      return [
        ...currentItems,
        {
          item,
          quantity: 1,
        },
      ];
    });
  }

  function removeFromCart(itemId: number) {
    setItems((currentItems) =>
      currentItems.filter(
        (cartItem) => cartItem.item.id !== itemId,
      ),
    );
  }

  function increaseQuantity(itemId: number) {
    setItems((currentItems) =>
      currentItems.map((cartItem) => {
        if (cartItem.item.id !== itemId) {
          return cartItem;
        }

        if (cartItem.quantity >= cartItem.item.stock) {
          return cartItem;
        }

        return {
          ...cartItem,
          quantity: cartItem.quantity + 1,
        };
      }),
    );
  }

  function decreaseQuantity(itemId: number) {
    setItems((currentItems) =>
      currentItems
        .map((cartItem) =>
          cartItem.item.id === itemId
            ? {
                ...cartItem,
                quantity: cartItem.quantity - 1,
              }
            : cartItem,
        )
        .filter((cartItem) => cartItem.quantity > 0),
    );
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = useMemo(
    () =>
      items.reduce(
        (total, cartItem) => total + cartItem.quantity,
        0,
      ),
    [items],
  );

  const totalPrice = useMemo(
    () =>
      items.reduce(
        (total, cartItem) =>
          total + cartItem.item.price * cartItem.quantity,
        0,
      ),
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider",
    );
  }

  return context;
}