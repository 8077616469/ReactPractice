
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import React, { Component } from 'react';

class Member2 extends Component {
	constructor(props) {
		super(props);
		this.state = {
			inputVO: {
				memberVO: {
					'id': '',
					'email': '',
					'cellphone': '',
					'password': '',
					'address': ''
				}
			},
			repoName: null,
			list: null,
			showList: []
		}
		this.query = this.query.bind(this);
		this.clear = this.clear.bind(this);
		this.changeEmailState = this.changeEmailState.bind(this)
		this.changeAddressState = this.changeAddressState.bind(this)
		this.changePasswordState = this.changePasswordState.bind(this)
		this.changePhoneState = this.changePhoneState.bind(this)
		this.member = {};
	}
	changeAddressState(event) {
		//使用setState將值寫到nameVal中
		this.setState({
			inputVO: {
				memberVO: {
					'id': this.state.inputVO.memberVO.id,
					'email': this.state.inputVO.memberVO.email,
					'cellphone': this.state.inputVO.memberVO.cellphone,
					'password': this.state.inputVO.memberVO.password,
					'address': event.target.value
				}
			}
		})
	}
	changeEmailState(event) {
		//使用setState將值寫到nameVal中
		this.setState({
			inputVO: {
				memberVO: {
					'id': this.state.inputVO.memberVO.id,
					'email': event.target.value,
					'cellphone': this.state.inputVO.memberVO.cellphone,
					'password': this.state.inputVO.memberVO.password,
					'address': this.state.inputVO.memberVO.address
				}
			}
		})
	}
	changePasswordState(event) {
		//使用setState將值寫到nameVal中
		this.setState({
			inputVO: {
				memberVO: {
					'id': this.state.inputVO.memberVO.id,
					'email': this.state.inputVO.memberVO.email,
					'cellphone': this.state.inputVO.memberVO.cellphone,
					'password': event.target.value,
					'address': this.state.inputVO.memberVO.address
				}
			}
		})
	}
	changePhoneState(event) {
		//使用setState將值寫到nameVal中
		this.setState({
			inputVO: {
				memberVO: {
					'id': this.state.inputVO.memberVO.id,
					'email': this.state.inputVO.memberVO.email,
					'cellphone': event.target.value,
					'password': this.state.inputVO.memberVO.password,
					'address': this.state.inputVO.memberVO.address
				}
			}
		})
	}




	query() {
		debugger;
		fetch('http://localhost:8080/angularJS/query', {
			method: 'POST',
			body: JSON.stringify(this.state.inputVO),
			headers: { 'Content-type': 'application/json; charset=UTF-8' }
		})
			.then(res => res.json())
			.then(data => {
				/*接到request data後要做的事情*/
				this.setState({
					// repoName: data[0]['name'],
					list: data.memberVO,
					// showList: []
				});
				this.state.showList = [];
				for (let i = 0; i <= this.state.list.length - 1; i++) {
					this.state.showList.push(<tr><td>{this.state.list[i]['email']}</td><td>{this.state.list[i]['password']}</td>
						<td>{this.state.list[i]['cellphone']}</td><td>{this.state.list[i]['address']}</td></tr>)
				}
			})
			.catch(e => {
				/*發生錯誤時要做的事情*/
				console.log(e);
			})
	}

	clear() {
		this.setState({
			repoName: null,
			list: null,
			showList: []
		});
	}

	render() {
		return (
			<Container>
				<Row>
					<h1 className="col text-center">會員查詢</h1>
				</Row>
				<Row>
					<Col>
						<InputGroup className="mb-3">
							<InputGroup.Text id="email">信箱</InputGroup.Text>
							<Form.Control
								placeholder=""
								aria-label="email"
								aria-describedby="email"
								value={this.state.inputVO.memberVO.email}
								onChange={this.changeEmailState}
							/>
						</InputGroup>
					</Col>
					<Col>
						<InputGroup className="mb-3">
							<InputGroup.Text id="password">密碼</InputGroup.Text>
							<Form.Control
								placeholder=""
								aria-label="password"
								aria-describedby="password"
								value={this.state.inputVO.memberVO.password}
								onChange={this.changePasswordState}
							/>
						</InputGroup>
					</Col>
				</Row>
				<Row>
					<Col>
						<InputGroup className="mb-3">
							<InputGroup.Text id="cellphone">手機</InputGroup.Text>
							<Form.Control
								placeholder=""
								aria-label="cellphone"
								aria-describedby="cellphone"
								value={this.state.inputVO.memberVO.cellphone}
								onChange={this.changePhoneState}
							/>
						</InputGroup>
					</Col>
					<Col>
						<InputGroup className="mb-3">
							<InputGroup.Text id="address">地址</InputGroup.Text>
							<Form.Control
								placeholder=""
								aria-label="address"
								aria-describedby="address"
								value={this.state.inputVO.memberVO.address}
								onChange={this.changeAddressState}
							/>
						</InputGroup></Col>
				</Row>
				<div className="mb-2 text-center">
					<Button variant="outline-info dark" size="lg" onClick={this.query}>會員查詢</Button>
					<Button variant="outline-secondary" size="lg">新增會員</Button>
					<Button variant="outline-success" size="lg">修改會員資料</Button>
					<Button variant="outline-danger" size="lg">刪除會員</Button>
					<Button variant="outline-warning" size="lg" onClick={this.clear}>清除</Button>
				</div>
				<Row>
					<h1 className="col text-center">查詢結果</h1>
				</Row>
				<Table striped bordered hover>
					<thead>
						<tr>
							<th>email</th>
							<th>密碼</th>
							<th>手機</th>
							<th>地址</th>
						</tr>
					</thead>
					<tbody>
						{this.state.showList}
					</tbody>
				</Table>
			</Container>
		)
	}
};
export default Member2;