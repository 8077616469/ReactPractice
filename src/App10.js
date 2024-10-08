import './App.css';

function App10(props){ // 在函式參數中加入props
  return(
    <button> {props.children} </button>
  );
}


export default App10;
