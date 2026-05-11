// Minimal react-router-dom compatibility shim over @tanstack/react-router.
import * as React from "react";
import {
  Link as TLink,
  Navigate as TNavigate,
  useNavigate as useTNavigate,
  useLocation as useTLocation,
} from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const AnyLink = TLink as unknown as React.ComponentType<any>;
const AnyNavigate = TNavigate as unknown as React.ComponentType<any>;

export const Link = React.forwardRef<HTMLAnchorElement, any>(function Link(
  { to, replace, state: _state, children, ...rest },
  ref,
) {
  return (
    <AnyLink ref={ref} to={to} replace={replace} {...rest}>
      {children}
    </AnyLink>
  );
});

export interface NavLinkProps {
  to: string;
  end?: boolean;
  replace?: boolean;
  className?: string | ((p: { isActive: boolean; isPending: boolean }) => string);
  style?: React.CSSProperties;
  children?: React.ReactNode | ((p: { isActive: boolean; isPending: boolean }) => React.ReactNode);
  activeClassName?: string;
  pendingClassName?: string;
  [key: string]: any;
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { to, end, className, activeClassName, pendingClassName, children, ...rest },
  ref,
) {
  return (
    <AnyLink
      ref={ref}
      to={to}
      activeOptions={{ exact: !!end }}
      {...rest}
      className={(state: any) => {
        const ctx = { isActive: !!state?.isActive, isPending: false };
        const base = typeof className === "function" ? className(ctx) : className;
        return cn(base, ctx.isActive && activeClassName, ctx.isPending && pendingClassName);
      }}
    >
      {typeof children === "function"
        ? ((state: any) =>
            (children as any)({ isActive: !!state?.isActive, isPending: false })) as any
        : children}
    </AnyLink>
  );
});

export function useNavigate() {
  const navigate = useTNavigate();
  return React.useCallback(
    (to: string | number, opts?: { replace?: boolean; state?: unknown }) => {
      if (typeof to === "number") {
        if (typeof window !== "undefined") window.history.go(to);
        return;
      }
      navigate({ to: to as any, replace: opts?.replace });
    },
    [navigate],
  );
}

export function useLocation() {
  return useTLocation();
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  return <AnyNavigate to={to} replace={replace} />;
}
