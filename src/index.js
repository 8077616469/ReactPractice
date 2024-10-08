import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App9 from './App9';
import App10 from './App10';
import App11 from './App11';
import App12 from './App12';
import Progress13 from './Progress'
import App15 from './App15';
import Member from './Member';
import reportWebVitals from './reportWebVitals';
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";

/*
呼叫const
*/
const testFunction =()=> {
  return( 
    <div>
        <button> 大家好 </button>
        <h1> 我不好 </h1>
    </div>
);
}
const multiButton=()=>{
  var output=[];
  for(let i=0;i<4;++i)
      output.push(<button>我是第{i}個按鍵</button>)
  return output;
}
/*
呼叫funtion
*/
function Progress(){
  const barWidth="50%";
  return(
      <div>
      <div className="progress-back" style={{backgroundColor:"rgba(0,0,0,0.2)",width:"200px",height:"7px",borderRadius:"10px"}}>
        <div className="progress-bar" style={{backgroundColor:"#fe5196",width:barWidth,height:"100%",borderRadius:"10px"}}></div>
      </div>
    </div>
  );
}



const printMessage=()=>{
  document.getElementById('show-area').innerHTML="我被按到了";
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render( 
  <div>
    <h1>學習來源:</h1><a href="https://ithelp.ithome.com.tw/users/20116826/ironman/2278">給初入JS框架新手的React.js入門</a>
    {/* <h1 style={{color: 'red'}}>呼叫const</h1><br></br>
    {testFunction()} */}
    {/* <h1 style={{color: 'red'}}>呼叫funtion</h1><br></br>
    <Progress/> */}
    {/* <h1 style={{color: 'red'}}>08. 用props綁定資料</h1><br></br>
    <App9 name="props帶入參數顯示在button"/> */}
    {/* <h1 style={{color: 'red'}}>09. 用props綁定函式</h1><br></br>
    <App9 name="props帶入參數顯示在button" handleClick={printMessage}/>
    <div id="show-area"></div> */}
    {/* <h1 style={{color: 'red'}}>10. children</h1><br></br>
    <App10> 在index.js中設定文字 </App10> */}
    {/* <h1 style={{color: 'red'}}>11. 開始進入class component</h1><br></br>
    <App11/> */}
    {/* <h1 style={{color: 'red'}}>12. state 與 詳解setState語法</h1><br></br>
    <App12/> */}
    {/* <h1 style={{color: 'red'}}>13. useState - 在function component用state</h1><br></br>
    <Progress13/> */}
    {/* <h1 style={{color: 'red'}}>15. 使用Http request - Fetch Api</h1><br></br>
    <App15/>  */}
    <h1 style={{color: 'red'}} className="text-center">會員CRUD</h1><br></br>
    <Member/>
    </div>
);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
