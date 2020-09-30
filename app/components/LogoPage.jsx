/**
 * Created by edenp on 11/10/2017.
 */

import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Consts from '../utils/consts';

import { FullScreenSegment } from './basic';
import ErrorPage from '../containers/ErrorPage';
import NoTenants from '../containers/NoTenants';
import Logo from './banner/Logo';
import NotFound from './NotFound';

export default function LogoPage() {
    return (
        <FullScreenSegment>
            <Logo />
            <Switch>
                <Route exact path={Consts.ERROR_PAGE_PATH} component={ErrorPage} />
                <Route exact path={Consts.ERROR_NO_TENANTS_PAGE_PATH} component={NoTenants} />
                <Route exact path={Consts.ERROR_404_PAGE_PATH} component={NotFound} />
            </Switch>
        </FullScreenSegment>
    );
}
