/**
 * Created by pawelposel on 09/11/2016.
 */

import md5 from 'blueimp-md5';
import _ from 'lodash';
import log from 'loglevel';
import { saveAs } from 'file-saver';
import marked from 'marked';
import { GenericField } from '../components/basic';

import ExecutionUtils from './shared/ExecutionUtils';
import JsonUtils from './shared/JsonUtils';
import TimeUtils from './shared/TimeUtils';
import UrlUtils from './shared/UrlUtils';

export default class StageUtils {
    static Execution = ExecutionUtils;

    static Json = JsonUtils;

    static Time = TimeUtils;

    static Url = UrlUtils;

    static parseMarkdown = marked;

    static saveAs(...args) {
        saveAs(args);
    }

    static makeCancelable(promise) {
        let hasCanceled = false;

        const wrappedPromise = new Promise((resolve, reject) => {
            promise
                .then(val => (hasCanceled ? reject({ isCanceled: true }) : resolve(val)))
                .catch(error => (hasCanceled ? reject({ isCanceled: true }) : reject(error)));
        });

        return {
            promise: wrappedPromise,
            cancel() {
                hasCanceled = true;
            }
        };
    }

    /**
     * @deprecated use TimeUtils.formatTimestamp
     * @param timestamp
     * @param outputPattern
     * @param inputPattern
     */
    static formatTimestamp(timestamp, outputPattern = 'DD-MM-YYYY HH:mm', inputPattern = 'YYYY-MM-DD HH:mm:ss') {
        return TimeUtils.formatTimestamp(timestamp, outputPattern, inputPattern);
    }

    /**
     * @deprecated use TimeUtils.formatLocalTimestamp
     * @param timestamp
     * @param outputPattern
     * @param inputPattern
     */
    static formatLocalTimestamp(timestamp, outputPattern = 'DD-MM-YYYY HH:mm', inputPattern = undefined) {
        return TimeUtils.formatLocalTimestamp(timestamp, outputPattern, inputPattern);
    }

    /**
     * Replace all occurrences of <Tag attr1="value1" attr1="value2" ...> to "tag value1 value2 ..."
     *
     * @param message
     * @returns {*}
     */
    static resolveMessage(message) {
        const tagPattern = /<(\w+)[^<]*>/;
        const noValueAttrPattern = /[',",`]([^',^",^`]+)[',",`]/;
        const attrPattern = /(\w+)=[',",`]([^',^",^`]+)[',",`]/g;

        let matchedTag;
        let matchedAttr;
        let sentence = '';
        let resolvedMessage = message;

        // eslint-disable-next-line no-cond-assign,scanjs-rules/accidental_assignment
        while ((matchedTag = tagPattern.exec(resolvedMessage))) {
            const tag = matchedTag[0];
            sentence = matchedTag[1].toLowerCase();

            const attributes = [];
            // eslint-disable-next-line no-cond-assign,scanjs-rules/accidental_assignment
            while ((matchedAttr = attrPattern.exec(tag))) {
                attributes.push({ key: matchedAttr[1], value: matchedAttr[2] });
            }

            if (attributes.length > 0) {
                if (attributes.length > 1) {
                    sentence += ' with';
                    // eslint-disable-next-line no-loop-func
                    _.each(attributes, (item, index) => {
                        sentence += ` ${item.key}=${item.value} ${index < attributes.length - 1 ? ' and' : ''}`;
                    });
                } else {
                    sentence += ` ${attributes[0].value}`;
                }
            } else {
                matchedAttr = noValueAttrPattern.exec(tag);
                if (matchedAttr) {
                    sentence += ` ${matchedAttr[1]}`;
                }
            }

            resolvedMessage = resolvedMessage.replace(tag, sentence);
        }

        return resolvedMessage;
    }

    static getMD5(str) {
        return md5(str);
    }

    /**
     * @deprecated use UrlUtils.url
     * @param path
     */
    static url(path) {
        return UrlUtils.url(path);
    }

    /**
     * @deprecated use UrlUtils.isUrl
     * @param str
     */
    static isUrl(str) {
        return UrlUtils.isUrl(str);
    }

    /**
     * @deprecated use UrlUtils.redirectToPage
     * @param url
     */
    static redirectToPage(url) {
        return UrlUtils.redirectToPage(url);
    }

    /**
     * @deprecated use UrlUtils.widgetResourceUrl
     * @param widgetId
     * @param internalPath
     * @param isCustom
     * @param addContextPath
     */
    static widgetResourceUrl(widgetId, internalPath, isCustom = true, addContextPath = true) {
        return UrlUtils.widgetResourceUrl(widgetId, internalPath, isCustom, addContextPath);
    }

    static buildConfig(widgetDefinition) {
        const configs = {};

        _.each(widgetDefinition.initialConfiguration, config => {
            if (!config.id) {
                log.log(
                    `Cannot process config for widget :"${widgetDefinition.name}" , because it missing an Id `,
                    config
                );
                return;
            }

            let value;
            if (config.default && !config.value) {
                value = config.default;
            } else if (_.isUndefined(config.value)) {
                value = null;
            } else {
                value = config.value;
            }

            configs[config.id] = GenericField.formatValue(config.type, value);
        });

        return configs;
    }

    static isUserAuthorized(permission, managerData) {
        const authorizedRoles = managerData.permissions[permission];

        const systemRole = managerData.auth.role;
        const groupSystemRoles = _.keys(managerData.auth.groupSystemRoles);
        const currentTenantRoles = managerData.auth.tenantsRoles[managerData.tenants.selected];
        const tenantRoles = currentTenantRoles ? currentTenantRoles.roles : [];
        const userRoles = _.uniq(tenantRoles.concat(systemRole, groupSystemRoles));
        return _.intersection(authorizedRoles, userRoles).length > 0;
    }

    static isWidgetPermitted(widgetSupportedEditions, managerData) {
        // Don't check the supported editions and keep backwards compatibility
        if (_.isEmpty(widgetSupportedEditions)) {
            return true;
        }

        const licenseEdition = _.get(managerData, 'license.data.license_edition', '');
        return _.includes(widgetSupportedEditions, licenseEdition);
    }
}
