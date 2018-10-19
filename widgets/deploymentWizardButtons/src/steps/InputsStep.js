/**
 * Created by jakub.niezgoda on 31/07/2018.
 */

import React, { Component } from 'react';

import ResourceStatus from './helpers/ResourceStatus';
import NoResourceMessage from './helpers/NoResourceMessage';

const inputsStepId = 'inputs';
const {createWizardStep} = Stage.Basic.Wizard.Utils;

class InputsStepActions extends Component {

    constructor(props) {
        super(props);
    }

    static propTypes = Stage.Basic.Wizard.Step.Actions.propTypes;

    static dataPath = 'blueprint.inputs';

    onNext(id) {
        const {InputsUtils} = Stage.Common;

        return this.props.onLoading()
            .then(this.props.fetchData)
            .then(({stepData}) => {
                let inputsWithoutValues = {};
                const blueprintInputsPlan = _.get(this.props.wizardData, InputsStepActions.dataPath, {});
                const deploymentInputs = InputsUtils.getInputsToSend(blueprintInputsPlan, stepData, inputsWithoutValues);

                if (!_.isEmpty(inputsWithoutValues)) {
                    return Promise.reject({
                        message: `Provide values for the following inputs: ${_.keys(inputsWithoutValues).join(', ')}`,
                        errors: inputsWithoutValues
                    });
                } else {
                    return this.props.onNext(id, {inputs: {...deploymentInputs}})
                }
            })
            .catch((error) => this.props.onError(id, error.message, error.errors));
    }

    render() {
        let {Wizard} = Stage.Basic;
        return <Wizard.Step.Actions {...this.props} onNext={this.onNext.bind(this)} />
    }
}

class InputsStepContent extends Component {

    constructor(props) {
        super(props);
    }

    static propTypes = Stage.Basic.Wizard.Step.Content.propTypes;

    static dataPath = 'blueprint.inputs';

    componentDidMount() {
        let stepData = _.mapValues(
            _.get(this.props.wizardData, InputsStepContent.dataPath, {}),
            (inputData, inputName) => {
                if (!_.isUndefined(this.props.stepData[inputName])) {
                    return this.props.stepData[inputName];
                } else {
                    return Stage.Common.InputsUtils.getInputFieldInitialValue(inputData.default);
                }
            }
        );
        this.props.onChange(this.props.id, {...stepData});
    }

    handleChange(event, {name, value}) {
        this.props.onChange(this.props.id, {...this.props.stepData, [name]: value});
    }

    getInputStatus(defaultValue) {
        if (_.isNil(defaultValue)) {
            return <ResourceStatus status={ResourceStatus.actionRequired} text='Input has no default value defined. Please provide value.' />;
        } else {
            return <ResourceStatus status={ResourceStatus.noActionRequired} text='Input has default value defined. No action required.' />;
        }
    }

    render() {
        let {Form, Table} = Stage.Basic;
        let {InputsUtils, InputsHeader} = Stage.Common;

        const inputs = _.get(this.props.wizardData, InputsStepContent.dataPath, {});
        const noInputs = _.isEmpty(inputs);

        return (
            <Form loading={this.props.loading} success={noInputs}>
                {
                    noInputs
                    ?
                        <NoResourceMessage resourceName='inputs'/>
                    :
                        <Table celled>
                            <Table.Header>
                                <Table.Row>
                                    <Table.HeaderCell>Input</Table.HeaderCell>
                                    <Table.HeaderCell colSpan='2'><InputsHeader header='Value' dividing={false} /></Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>

                            <Table.Body>
                                {
                                    _.map(_.keys(this.props.stepData), (inputName) =>
                                        !_.isNil(inputs[inputName]) &&
                                        <Table.Row key={inputName} name={inputName}>
                                            <Table.Cell collapsing>
                                                <Form.Field key={inputName} help={inputs[inputName].description}
                                                            label={inputName} />
                                            </Table.Cell>
                                            <Table.Cell collapsing>
                                                {this.getInputStatus(inputs[inputName].default)}
                                            </Table.Cell>
                                            <Table.Cell>
                                                {
                                                    InputsUtils.getInputField(inputName,
                                                                              this.props.stepData[inputName],
                                                                              inputs[inputName].default,
                                                                              this.handleChange.bind(this),
                                                                              this.props.errors[inputName])
                                                }
                                            </Table.Cell>
                                        </Table.Row>
                                    )
                                }
                            </Table.Body>
                        </Table>
                }
            </Form>
        );
    }
}

export default createWizardStep(inputsStepId,
                                'Inputs',
                                'Provide inputs',
                                InputsStepContent,
                                InputsStepActions);