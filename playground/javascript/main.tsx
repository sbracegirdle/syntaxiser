import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
type Props = { title: string; children?: ReactNode };
export const TypedView = ({ title, children }: Props) => {
  const [name, setName] = useState<string>('');
  const input = useRef<HTMLInputElement>(null);
  const change = (event: ChangeEvent<HTMLInputElement>) => setName(event.currentTarget.value);
  useEffect(() => {
    const focus = () => input.current?.focus();
    window.addEventListener('focus', focus);
    return () => window.removeEventListener('focus', focus);
  }, []);
  return <section><h1>{title}</h1><input ref={input} value={name} onChange={change} />{children}<output>{name}</output></section>;
};
