import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';

export default function game_init(root) {
  ReactDOM.render(<Battleship />, root);
}

class Battleship extends React.Component {
    constructor (props) {

    }

    render () {
        <div>
            <p>🤔 game_test</p>
        </div>
    }
}