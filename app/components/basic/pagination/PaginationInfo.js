/**
 * Created by pawelposel on 17/11/2016.
 */
  
import React, { Component, PropTypes } from 'react';
import Dropdown from '../form/FormDropdown';

export default class PaginationInfo extends Component {

    static propTypes = {
        currentPage: PropTypes.number.isRequired,
        pageSize: PropTypes.number.isRequired,
        totalSize: PropTypes.number.isRequired,
        onPageSizeChange: PropTypes.func.isRequired
    };

    static pageSizes = [5, 10, 25, 50, 100];

    _handleChange(e, { value }) {
        console.log(value);

        this.props.onPageSizeChange(value);
    }

    render() {
        if (this.props.totalSize <= 0) {
            return null;
        }

        let start = (this.props.currentPage-1)*this.props.pageSize + 1;
        let stop = Math.min(start + this.props.pageSize - 1, this.props.totalSize);

        let options = _.map(PaginationInfo.pageSizes, item => { return { text: item, value: item } });

        return (
            <div className="ui small form">
                Page size:&nbsp;

                <Dropdown compact search selection allowAdditions text={this.props.pageSize + ""}
                          options={options} onChange={this._handleChange.bind(this)} className="upward"/>

                &nbsp;&nbsp;{start} to {stop} of {this.props.totalSize} entries

            </div>
        );
    }
}
 