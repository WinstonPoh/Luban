import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Trans } from 'react-i18next';

import { includes } from 'lodash';
import { useSelector } from 'react-redux';
import i18n from '../../../lib/i18n';
import { Button } from '../../components/Buttons';
import Switch from '../../components/Switch';
import TipTrigger from '../../components/TipTrigger';
import { SnapmakerArtisanMachine } from '../../../machines';

const MotionButtonGroup = (props) => {
    const { actions, runBoundary, executeGcode, disabled } = props;
    const { activeMachine } = useSelector((state) => state.workspace);
    // Opt-in diagonal Go-To-Work-Origin: when on, all axes move at once (hypotenuse) for speed.
    // Default off keeps the safe Z-sequenced move that prevents a diagonal bed plunge (audit R6).
    const [diagonalOrigin, setDiagonalOrigin] = useState(false);


    const setOriginWork = () => {
        let gcode = 'G92 X0 Y0 Z0 B0';
        // Fixme: hard code for artisan asking to store current work origin which is about Power Loss Recovery
        if (includes([SnapmakerArtisanMachine], activeMachine)) {
            gcode += '\nM500';
        }
        executeGcode(gcode);
    };
    // const { canClick } = state;

    return (
        <div className="sm-flex-overflow-visible" style={{ flexDirection: 'column' }}>
            <TipTrigger
                title={i18n._('Run Boundary')}
                content={(
                    <div>
                        <p>{i18n._('key-Workspace/Control/MotionButton-Click to check the boundary of the image to be engraved.')}</p>
                        <br />
                        {!props.isConnectedRay && (
                            <p>
                                <Trans i18nKey="key-unused-Note: If you are using the CNC Carving Module, make sure the carving bit will not run into the fixtures before you use this feature.">
                                Note: If you are using the CNC Carving Module, make sure the carving bit will not run into the fixtures before you use this feature.
                                </Trans>
                            </p>
                        )}
                    </div>
                )}
            >
                <Button
                    width="144px"
                    type="primary"
                    className="margin-bottom-8 display-block"
                    priority="level-three"
                    onClick={runBoundary}
                    disabled={disabled}
                >
                    {i18n._('Run Boundary')}
                </Button>
            </TipTrigger>
            <TipTrigger
                title={i18n._('key-Workspace/Control/MotionButton-Go To Work Origin')}
                content={i18n._('key-Workspace/Control/MotionButton-Move the head to the last saved work origin.')}
            >
                <Button
                    width="144px"
                    type="primary"
                    className="margin-bottom-8 display-block"
                    priority="level-three"
                    onClick={() => {
                        if (props.isConnectedRay) {
                            actions.move({ z: 0, x: 0, y: 0, b: 0 }, true);
                        } else {
                            // diagonalOrigin=on => single all-axis move (faster, no Z clearance);
                            // off => Z sequenced separately to avoid a diagonal bed plunge (audit R6).
                            actions.goToWorkOrigin(diagonalOrigin);
                        }
                    }}
                    disabled={disabled}
                >
                    {i18n._('key-Workspace/Control/MotionButton-Go To Work Origin')}
                </Button>
            </TipTrigger>
            {!props.isConnectedRay && (
                <div className="sm-flex justify-space-between align-center margin-bottom-8" style={{ width: '144px' }}>
                    <span className="text-overflow-ellipsis margin-right-4">{i18n._('Diagonal move (workspace clear)')}</span>
                    <Switch
                        className="sm-flex-auto"
                        onClick={() => setDiagonalOrigin(!diagonalOrigin)}
                        checked={diagonalOrigin}
                        disabled={disabled}
                    />
                </div>
            )}
            <TipTrigger
                title={i18n._('key-Workspace/Control/MotionButton-Set Work Origin')}
                content={i18n._('key-Workspace/Control/MotionButton-Set the current position of the toolhead as the work origin.')}
            >
                <Button
                    width="144px"
                    type="primary"
                    className="margin-bottom-8 display-block"
                    priority="level-three"
                    onClick={setOriginWork}
                    disabled={disabled}
                >
                    {i18n._('key-Workspace/Control/MotionButton-Set Work Origin')}
                </Button>
            </TipTrigger>
        </div>
    );
};

MotionButtonGroup.propTypes = {
    disabled: PropTypes.bool,
    actions: PropTypes.object,
    runBoundary: PropTypes.func,
    executeGcode: PropTypes.func,
    isConnectedRay: PropTypes.bool
};

export default MotionButtonGroup;
