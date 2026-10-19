import { createContext, ReactNode, useContext } from "react";
import { Pressable, Text, View } from "react-native";

export type ButtonAction = "default" | "primary" | "secondary" | "destructive";
export type ButtonVariant = "solid" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonAlign = "center" | "start";

type ButtonCtx = {
  action: ButtonAction;
  variant: ButtonVariant;
  size: ButtonSize;
};

const ButtonContext = createContext<ButtonCtx>({
  action: "default",
  variant: "solid",
  size: "md",
});

// --- Styles ---

const CONTAINER_VARIANT: Record<ButtonVariant, Record<ButtonAction, string>> = {
  solid: {
    default: "bg-surface-elevated",
    primary: "bg-primary",
    secondary: "bg-secondary",
    destructive: "bg-error",
  },
  outline: {
    default: "bg-transparent border border-border",
    primary: "bg-transparent border border-primary",
    secondary: "bg-transparent border border-secondary",
    destructive: "bg-transparent border border-error",
  },
  ghost: {
    default: "bg-transparent",
    primary: "bg-transparent",
    secondary: "bg-transparent",
    destructive: "bg-transparent",
  },
};

const CONTAINER_SIZE: Record<ButtonSize, string> = {
  sm: "px-3 py-2 rounded-lg",
  md: "px-4 py-3 rounded-xl",
  lg: "px-5 py-4 rounded-xl",
};

// --- API ---

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  action?: ButtonAction;
  size?: ButtonSize;
  align?: ButtonAlign;
  onPress?: () => void;
  className?: string;
};

export const Button = ({
  children,
  variant = "solid",
  action = "default",
  size = "md",
  align = "center",
  onPress,
  className = "",
}: ButtonProps) => {
  const justify = align === "start" ? "justify-start" : "justify-center";

  return (
    <ButtonContext.Provider value={{ action, variant, size }}>
      <Pressable
        onPress={onPress}
        className={`flex-row items-center gap-3 ${justify} ${CONTAINER_VARIANT[variant][action]} ${CONTAINER_SIZE[size]} active:opacity-60 ${className}`}
      >
        {children}
      </Pressable>
    </ButtonContext.Provider>
  );
};

// --- ButtonText ---

const TEXT_VARIANT: Record<ButtonVariant, Record<ButtonAction, string>> = {
  solid: {
    default: "text-foreground",
    primary: "text-primary-foreground",
    secondary: "text-secondary-foreground",
    destructive: "text-error-foreground",
  },
  outline: {
    default: "text-foreground",
    primary: "text-primary",
    secondary: "text-secondary",
    destructive: "text-error",
  },
  ghost: {
    default: "text-foreground",
    primary: "text-primary",
    secondary: "text-secondary",
    destructive: "text-error",
  },
};

const TEXT_SIZE: Record<ButtonSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export const ButtonText = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => {
  const { action, variant, size } = useContext(ButtonContext);
  return (
    <Text
      className={`font-medium ${TEXT_VARIANT[variant][action]} ${TEXT_SIZE[size]} ${className}`}
    >
      {children}
    </Text>
  );
};

// --- ButtonIcon ---

export const ButtonIcon = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <View className={`items-center justify-center ${className}`}>{children}</View>
);
