import React from 'react'
import './App.css'
import {BrowserRouter,Routes,Route} from 'react-router-dom'
import Landingpage from './components/Landingpage'
import { AuthProvider } from './components/AuthContext'
import Dlandingpage from './Dashboard/Dlandingpage'
import Error from './components/Error'
const App = () => {
  // const isonline=navigator.onLine
  const isonline=true;

  return (
    <div>
        
         {isonline?(
          
       <AuthProvider>
          <BrowserRouter>
           {/* <Topbar></Topbar> */}
             <Landingpage></Landingpage>
             <Dlandingpage></Dlandingpage>
         </BrowserRouter>
      </AuthProvider>
  
):(
  <div>
    <Error></Error>
   
  </div>
)}
    
    
    </div>
  )
}

export default App
