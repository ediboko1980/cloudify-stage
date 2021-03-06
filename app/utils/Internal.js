/**
 * Created by pposel on 09/02/2017.
 */

import _ from 'lodash';
import Cookies from 'js-cookie';
import External from './External';
import Consts from './consts';
import StageUtils from './stageUtils';

export default class Internal extends External {
    buildHeaders() {
        if (!this.data) {
            return {};
        }

        const headers = { tenant: _.get(this.data, 'tenants.selected', Consts.DEFAULT_TENANT) };

        // read token from cookies
        const token = Cookies.get(Consts.TOKEN_COOKIE_NAME);
        if (token) {
            headers['Authentication-Token'] = token;
        }

        return headers;
    }

    buildActualUrl(path, data) {
        return super.buildActualUrl(StageUtils.Url.url(path), data);
    }

    // eslint-disable-next-line class-methods-use-this
    isUnauthorized(response) {
        return response.status === 401;
    }

    // eslint-disable-next-line class-methods-use-this
    isLicenseError(response, body) {
        return (
            response.status === 400 &&
            (body.error_code === Consts.NO_LICENSE_ERROR_CODE || body.error_code === Consts.EXPIRED_LICENSE_ERROR_CODE)
        );
    }
}
