import { useEffect, useRef, useState } from 'react';
export const TaskView = ({ tasks }) => {
  const [count, setCount] = useState(0);
  const input = useRef(null);
  useEffect(() => {
    const resize = () => { document.title = `Width ${window.innerWidth}`; };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  return <><input aria-label="Task name" ref={input} />
    <button onClick={() => setCount(value => value + 1)}>Tasks: {count}</button>
    <ul>{tasks.map(task => <li key={task.id}>{task.name}</li>)}</ul></>;
};
