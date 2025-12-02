import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function Movies(){
  const [movies, setMovies] = useState([])
  useEffect(()=>{
    fetch('http://localhost:4000/api/movies').then(r=>r.json()).then(setMovies)
  },[])

  return (
    <div style={{padding:24}}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2>All Movies</h2>
        <Link to='/'>Back home</Link>
      </header>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginTop:12}}>
        {movies.map(m=>(
          <div key={m.id} style={{background:'#fff', padding:12, borderRadius:10}}>
            <div style={{height:140, background:'#f3f4f6', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center'}}>{m.title}</div>
            <div style={{marginTop:8, fontWeight:700}}>{m.title}</div>
            <div style={{color:'#666'}}>{m.genre} • {m.duration}</div>
            <div style={{marginTop:8}}><button onClick={()=> window.location.href='/#'} style={{padding:'8px 10px', background:'#3b82f6', color:'#fff', border:'none', borderRadius:6}}>Details</button></div>
          </div>
        ))}
      </div>
    </div>
  )
}
