import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import i18n from 'i18next';

import { DataTable } from '../../basic';
import ClusterService from './ClusterService';
import NodeStatus from './NodeStatus';
import { nodeServicesPropType } from './NodeServices';
import { clusterNodeStatuses, clusterServiceEnum, clusterServiceStatuses, clusterServiceBgColor } from './consts';

const PublicIP = ({ ip, serviceName }) =>
    ip && serviceName === clusterServiceEnum.manager ? (
        <a href={`http://${ip}`} target="_blank" rel="noopener noreferrer">
            {ip}
        </a>
    ) : (
        ip
    );
PublicIP.propTypes = {
    ip: PropTypes.string,
    serviceName: PropTypes.string.isRequired
};
PublicIP.defaultProps = {
    ip: ''
};

function ClusterServicesList({ services }) {
    const noServicesMessage = i18n.t('cluster.servicesList.noServices', 'There are no Cluster Services available.');

    return (
        <DataTable noDataMessage={noServicesMessage} noDataAvailable={_.isEmpty(services)} selectable>
            <DataTable.Column label={i18n.t('cluster.servicesList.serviceType', 'Service Type')} width="25%" />
            <DataTable.Column label={i18n.t('cluster.servicesList.modeName', 'Node Name')} width="25%" />
            <DataTable.Column label={i18n.t('cluster.servicesList.status', 'Status')} width="5%" />
            <DataTable.Column label={i18n.t('cluster.servicesList.privateIp', 'Private IP')} width="15%" />
            <DataTable.Column label={i18n.t('cluster.servicesList.publicIp', 'Public IP / LB IP')} width="15%" />
            <DataTable.Column label={i18n.t('cluster.servicesList.version', 'Version')} width="15%" />

            {_.map(services, (service, serviceName) => {
                const numberOfNodes = _.size(service.nodes);

                return _(service.nodes)
                    .map((node, nodeName) => ({ name: nodeName, ...node }))
                    .sortBy('name')
                    .map((node, index) => (
                        <DataTable.Row key={`${serviceName}_${node.name}_${node.private_ip}`}>
                            {index === 0 && (
                                <DataTable.Data
                                    rowSpan={numberOfNodes}
                                    style={{ backgroundColor: clusterServiceBgColor(service.status) }}
                                >
                                    <ClusterService isExternal={service.is_external} name={serviceName} />
                                </DataTable.Data>
                            )}
                            <DataTable.Data>{node.name}</DataTable.Data>
                            <DataTable.Data>
                                <NodeStatus
                                    name={node.name}
                                    type={serviceName}
                                    status={node.status}
                                    services={node.services}
                                />
                            </DataTable.Data>
                            <DataTable.Data>{node.private_ip}</DataTable.Data>
                            <DataTable.Data>
                                <PublicIP ip={node.public_ip} serviceName={serviceName} />
                            </DataTable.Data>
                            <DataTable.Data>{node.version}</DataTable.Data>
                        </DataTable.Row>
                    ))
                    .value();
            })}
        </DataTable>
    );
}

const clusterServiceProps = PropTypes.shape({
    status: PropTypes.oneOf(clusterServiceStatuses).isRequired,
    nodes: PropTypes.objectOf(
        PropTypes.shape({
            status: PropTypes.oneOf(clusterNodeStatuses).isRequired,
            public_ip: PropTypes.string,
            version: PropTypes.string.isRequired,
            private_ip: PropTypes.string.isRequired,
            services: nodeServicesPropType
        })
    ).isRequired,
    is_external: PropTypes.bool.isRequired
}).isRequired;

ClusterServicesList.propTypes = {
    services: PropTypes.shape(_.mapValues(clusterServiceEnum, () => clusterServiceProps)).isRequired
};

const mapStateToProps = state => ({
    services: _.get(state, 'manager.clusterStatus.services', {})
});
export default connect(mapStateToProps)(ClusterServicesList);
