import React, { Component } from 'react';
class App15 extends Component {
  constructor(props) {
    super(props);
    this.state={
      repoName: null
    }
    this.handleClick=this.handleClick.bind(this);
  }

  
  handleClick(){
    fetch( 'https://api.github.com/users/8077616469/repos',{method:"GET"})
    .then(res => res.json())
    .then(data => {
          /*接到request data後要做的事情*/
          this.setState({repoName: data[0]['name']});
    })
    .catch(e => {
        /*發生錯誤時要做的事情*/
        console.log(e);
    })
  }
  
  render() {
      return (
        <div className="App">
          <div className="data-display">
            {(this.state.repoName===null)?"目前還有沒有資料":this.state.repoName}
          </div>
          <button onClick={this.handleClick}>取得8077616469以英文字母排序的第一個repo</button>
    	</div>
    )
  }
};
export default App15;