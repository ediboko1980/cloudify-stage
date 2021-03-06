/**
 * Created by kinneretzin on 08/09/2016.
 */
import i18n from 'i18next';
import _ from 'lodash';
import log from 'loglevel';
import Internal from './Internal';
import ScriptLoader from './scriptLoader';
import StyleLoader from './StyleLoader';
import 'd3';

import * as Basic from '../components/basic';
import * as Shared from '../components/shared';
import StageUtils from './stageUtils';
import LoaderUtils from './LoaderUtils';

import GenericConfig from './GenericConfig';
import WidgetDefinition from './WidgetDefinition';
import * as PropTypes from './props';
import * as Hooks from './hooks';

const ReactDOMServer = require('react-dom/server');

let widgetDefinitions = [];

function updateReadmeLinks(content) {
    const linkRegex = /(\[.*?\])\(\s*(?!http)(.*?)\s*\)/gm;
    let newContent = content;

    newContent = newContent.replace(linkRegex, `$1(${i18n.t('widgets.common.readmes.linksBasePath')}$2)`);

    return newContent;
}

function convertReadmeParams(content) {
    const paramRegex = /{{<\s*param\s*(\S*)\s*>}}/gm;
    let newContent = content;

    Array.from(newContent.matchAll(paramRegex)).forEach(match => {
        const paramName = match[1];
        const paramValue = i18n.t(`widgets.common.readmes.params.${paramName}`);
        if (paramValue !== undefined) {
            newContent = newContent.replace(match[0], paramValue);
        }
    });

    return newContent;
}

export default class WidgetDefinitionsLoader {
    static init() {
        window.Stage = {
            defineWidget: widgetDefinition => {
                widgetDefinitions.push(new WidgetDefinition({ ...widgetDefinition, id: document.currentScript.id }));
            },
            Basic,
            Shared,
            ComponentToHtmlString: component => {
                return ReactDOMServer.renderToString(component);
            },
            GenericConfig,
            Utils: StageUtils,

            Common: [],
            defineCommon: def => {
                window.Stage.Common[def.name] = def.common;
            },

            PropTypes,
            definePropType: def => {
                window.Stage.PropTypes[def.name] = def.common;
            },

            Hooks,
            defineHook: def => {
                window.Stage.Hooks = { ...window.Stage.Hooks, ...def };
            },

            i18n
        };
    }

    static loadWidgets(manager) {
        log.log('Load widgets');

        const internal = new Internal(manager);
        return Promise.all([
            new ScriptLoader(LoaderUtils.getResourceUrl('widgets/common/common.js', false)).load(), // Commons has to load before the widgets
            internal.doGet('/widgets/list') // We can load the list of widgets in the meanwhile
        ]).then(results => {
            const data = results[1]; // widgets data
            const promises = [];
            data.forEach(item => {
                promises.push(WidgetDefinitionsLoader.loadWidget(item, false));
            });

            const output = _.keyBy(data, 'id');
            return Promise.all(promises).then(() => output);
        });
    }

    static loadWidget(widget, rejectOnError) {
        const scriptPath = `${LoaderUtils.getResourceUrl('widgets', widget.isCustom)}/${widget.id}/widget.js`;
        return new ScriptLoader(scriptPath).load(widget.id, rejectOnError);
    }

    static loadWidgetsResources(widgets) {
        log.log('Load widgets resources');

        const promises = [];
        widgetDefinitions.forEach(widgetDefinition => {
            // Mark system widgets to protect against uninstalling
            widgetDefinition.isCustom = widgets[widgetDefinition.id].isCustom;

            if (widgetDefinition.hasTemplate) {
                promises.push(
                    LoaderUtils.fetchResource(
                        `widgets/${widgetDefinition.id}/widget.html`,
                        widgetDefinition.isCustom
                    ).then(widgetHtml => {
                        if (widgetHtml) {
                            widgetDefinition.template = widgetHtml;
                        }
                    })
                );
            }
            if (widgetDefinition.hasStyle) {
                promises.push(
                    new StyleLoader(
                        LoaderUtils.getResourceUrl(
                            `widgets/${widgetDefinition.id}/widget.css`,
                            widgetDefinition.isCustom
                        )
                    ).load()
                );
            }

            if (widgetDefinition.hasReadme) {
                promises.push(
                    LoaderUtils.fetchResource(
                        `widgets/${widgetDefinition.id}/README.md`,
                        widgetDefinition.isCustom
                    ).then(widgetReadme => {
                        if (widgetReadme) {
                            widgetDefinition.readme = widgetDefinition.isCustom
                                ? widgetReadme
                                : updateReadmeLinks(convertReadmeParams(widgetReadme));
                        }
                    })
                );
            }
        });

        return Promise.all(promises);
    }

    static initWidgets() {
        log.log('Init widgets');

        _.each(widgetDefinitions, w => {
            if (w.init && typeof w.init === 'function') {
                w.init();
            }
        });

        const loadedWidgetDefinitions = _.sortBy(widgetDefinitions, ['name']);
        widgetDefinitions = []; // Clear for next time

        return Promise.resolve(loadedWidgetDefinitions);
    }

    static load(manager) {
        return WidgetDefinitionsLoader.loadWidgets(manager)
            .then(widgets => WidgetDefinitionsLoader.loadWidgetsResources(widgets))
            .then(() => WidgetDefinitionsLoader.initWidgets())
            .catch(e => {
                log.error(e);
                widgetDefinitions = []; // Clear for next time
            });
    }

    static installWidget(widgetFile, widgetUrl, manager) {
        const internal = new Internal(manager);

        if (widgetUrl) {
            log.log('Install widget from url', widgetUrl);
            return internal.doPut('/widgets/install', { url: widgetUrl });
        }
        log.log('Install widget from file');
        return internal.doUpload('/widgets/install', {}, { widget: widgetFile });
    }

    static updateWidget(widgetId, widgetFile, widgetUrl, manager) {
        const internal = new Internal(manager);

        if (widgetUrl) {
            log.log(`Update widget ${widgetId} from url`, widgetUrl);
            return internal.doPut('/widgets/update', { url: widgetUrl, id: widgetId });
        }
        log.log(`Update widget ${widgetId} from file`);
        return internal.doUpload('/widgets/update', { id: widgetId }, { widget: widgetFile });
    }

    static validateWidget(widgetId, manager) {
        const errors = [];

        if (_.isEmpty(widgetDefinitions)) {
            errors.push(
                i18n.t(
                    'widget.validationErrors.noWidgetDefinition',
                    'Widget not properly initialized. Please check if widget.js is correctly defined.'
                )
            );
        } else if (widgetDefinitions.length > 1) {
            errors.push(
                i18n.t(
                    'widget.validationErrors.multipleDefinitions',
                    'Only single widget should be defined within widget.js'
                )
            );
        } else {
            const widgetDefinition = widgetDefinitions[0];

            if (!_.includes(_.keys(manager.permissions), widgetDefinition.permission)) {
                errors.push(
                    i18n.t(
                        'widget.validationErrors.invalidPermission',
                        `Specified widget permission ('{{permission}}') not found in available permissions list.`,
                        widgetDefinition
                    )
                );
            }

            if (_.isEmpty(widgetDefinition.id)) {
                errors.push(
                    i18n.t(
                        'widget.validationErrors.idNotSpecified',
                        "Mandatory field - 'id' - not specified in widget definition."
                    )
                );
            }

            if (_.isEmpty(widgetDefinition.name)) {
                errors.push(
                    i18n.t(
                        'widget.validationErrors.nameNotSpecified',
                        "Mandatory field - 'name' - not specified in widget definition."
                    )
                );
            }
        }

        if (!_.isEmpty(errors)) {
            const errorMessage =
                errors.length > 1
                    ? i18n.t('widget.validationErrors.multipleErrors', `Multiple errors occured: {{}}`, {
                          errors: _.join(errors, ' ')
                      })
                    : errors[0];

            return WidgetDefinitionsLoader.uninstall(widgetId, manager).then(() => {
                throw new Error(errorMessage);
            });
        }

        return Promise.resolve();
    }

    static install(widgetFile, widgetUrl, manager) {
        let widgetData = {};

        return WidgetDefinitionsLoader.installWidget(widgetFile, widgetUrl, manager)
            .then(data => {
                widgetData = data;
                return WidgetDefinitionsLoader.loadWidget(data, true);
            })
            .then(() => WidgetDefinitionsLoader.validateWidget(widgetData.id, manager))
            .then(() => WidgetDefinitionsLoader.loadWidgetsResources(_.keyBy([widgetData], 'id')))
            .then(() => WidgetDefinitionsLoader.initWidgets())
            .catch(err => {
                widgetDefinitions = []; // Clear for next time
                log.error(err);
                throw err;
            });
    }

    static update(widgetId, widgetFile, widgetUrl, manager) {
        let widgetData = {};

        return WidgetDefinitionsLoader.updateWidget(widgetId, widgetFile, widgetUrl, manager)
            .then(data => {
                widgetData = data;
                return WidgetDefinitionsLoader.loadWidget(data, true);
            })
            .then(() => WidgetDefinitionsLoader.validateWidget(widgetData.id, manager))
            .then(() => WidgetDefinitionsLoader.loadWidgetsResources(_.keyBy([widgetData], 'id')))
            .then(() => WidgetDefinitionsLoader.initWidgets())
            .catch(err => {
                widgetDefinitions = []; // Clear for next time
                log.error(err);
                throw err;
            });
    }

    static uninstall(widgetId, manager) {
        const internal = new Internal(manager);
        return internal.doDelete(`/widgets/${widgetId}`);
    }
}
