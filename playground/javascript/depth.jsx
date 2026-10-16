// Cursor tour; the server's /depth page runs exact catalog components.
import { useReducer, useContext, createContext } from 'react';
export const Theme = createContext('system');
export function QuantityForm() {
  const [quantity, dispatch] = useReducer((value, action) => action === 'add' ? value + 1 : 0, 0);
  const theme = useContext(Theme);
  function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log(data.get('name'));
  }
  return <form onSubmit={submit}><label>Name<input name="name" /></label>
    <button type="button" onClick={() => dispatch('add')}>Quantity: {quantity}</button>
    <button>Save in {theme}</button></form>;
}
export function delegate(container) {
  const click = event => {
    const button = event.target.closest('button[data-id]');
    if (button && container.contains(button)) console.log(button.dataset.id);
  };
  container.addEventListener('click', click);
  return () => container.removeEventListener('click', click);
}
