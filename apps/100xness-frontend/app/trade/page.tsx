"use client";
import { useWs } from '@/app/hooks/useWs';

const Trade = () => {

  const { messages } = useWs();


  return (

    <div>
      <ul>{messages.map((msg, id) => (
        <li key={id}>{msg}</li>
      ))}</ul>
    </div>
  )
}

export default Trade