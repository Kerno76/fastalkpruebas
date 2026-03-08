import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import {entries} from './data'
import {Card} from './components/Cards'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='dashboard'>   
         <h1 id='dashTitle'>Dashboard</h1>

          <div className='cardsContainer'>
          {entries.map((entry, index) => (
            <Card
              key={index}
              img={entry.img}
              title={entry.title}
              amount={entry.amount}
            />
            ))}
          </div>

      </div>
    </>
  )
}

export default App
