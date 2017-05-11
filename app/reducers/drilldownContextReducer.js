/**
 * Created by kinneretzin on 9/5/2017.
 */


import * as types from '../actions/types';

const drillDownContext = (state = [], action) => {
    switch (action.type) {
        case types.SET_DRILLDOWN_CONTEXT:
            return action.drilldownContext;
        default:
            return state;
    }
};


export default drillDownContext;
