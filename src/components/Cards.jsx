export function Card({img, title, amount}){
  return(
    <div className='card'>
      <img src={img}></img>
      <h1>{title}</h1>
      <h2>{amount}</h2>
    </div>
  )
}