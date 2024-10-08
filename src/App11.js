import React, { Component } from 'react';
class App extends Component{
  constructor(props) { 
    super(props);
    this.name="舊的名字"; // 加入name
    this.changeName=this.changeName.bind(this); //綁定至自己
  }
 
 changeName(newName){ // 定義changeName
    this.name=newName;
    console.log("hey")
  }

    render(){
      return(
        <button onClick={this.changeName}>{this.name}</button>
      );
  }
  }


export default App;