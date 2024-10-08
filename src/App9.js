import React, { Component } from 'react';
import './App.css';

function App9(props){ // 在函式參數中加入props
  return(
    <button onClick={props.handleClick}> {props.name} </button>
  );
}

export default App9;
