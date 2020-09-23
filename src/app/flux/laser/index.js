import * as THREE from 'three';
// import { DATA_PREFIX, EPSILON } from '../../constants';
import { DATA_PREFIX, MACHINE_SERIES, PAGE_EDITOR } from '../../constants';
import { controller } from '../../lib/controller';
import ModelGroup from '../models/ModelGroup';
import ToolPathModelGroup from '../models/ToolPathModelGroup';
import {
    ACTION_RESET_CALCULATED_STATE, ACTION_UPDATE_CONFIG,
    ACTION_UPDATE_GCODE_CONFIG,
    ACTION_UPDATE_STATE,
    ACTION_UPDATE_TRANSFORMATION
} from '../actionType';
import { actions as editorActions, CNC_LASER_STAGE } from '../editor';
import SvgModelGroup from '../models/SvgModelGroup';

const INITIAL_STATE = {

    page: PAGE_EDITOR,

    materials: {
        isRotate: false,
        diameter: 24,
        length: MACHINE_SERIES.ORIGINAL.setting.size.y,
        fixtureLength: 20,
        x: 0,
        y: 0,
        z: 0
    },

    stage: CNC_LASER_STAGE.EMPTY,
    progress: 0,

    modelGroup: new ModelGroup(),
    toolPathModelGroup: new ToolPathModelGroup(),
    svgModelGroup: new SvgModelGroup(),

    isAllModelsPreviewed: false,
    isGcodeGenerating: false,
    gcodeFile: null,

    // model: null,
    selectedModelID: null,
    selectedModelHideFlag: false,
    sourceType: '',
    mode: '',
    showOrigin: null,

    printOrder: 1,
    transformation: {},
    transformationUpdateTime: new Date().getTime(),

    gcodeConfig: {},
    config: {},

    // snapshot state
    undoSnapshots: [{ models: [], toolPathModels: [] }], // snapshot { models, toolPathModels }
    redoSnapshots: [], // snapshot { models, toolPathModels }
    canUndo: false,
    canRedo: false,

    // modelGroup state
    hasModel: false,
    isAnyModelOverstepped: false,

    // boundingBox: new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()), // bbox of selected model
    background: {
        enabled: false,
        group: new THREE.Group()
    },

    previewFailed: false,
    autoPreviewEnabled: true,

    // rendering
    renderingTimestamp: 0
};

const ACTION_SET_BACKGROUND_ENABLED = 'laser/ACTION_SET_BACKGROUND_ENABLED';

export const actions = {
    init: () => (dispatch) => {
        dispatch(editorActions.init('laser'));

        const controllerEvents = {
            'taskCompleted:generateToolPath': (taskResult) => {
                if (taskResult.headType === 'laser') {
                    dispatch(editorActions.onReceiveTaskResult('laser', taskResult));
                }
            },
            'taskCompleted:generateGcode': (taskResult) => {
                if (taskResult.headType === 'laser') {
                    dispatch(editorActions.onReceiveGcodeTaskResult('laser', taskResult));
                }
            },
            'taskProgress:generateToolPath': (taskResult) => {
                if (taskResult.headType === 'laser') {
                    dispatch(editorActions.updateState('laser', {
                        stage: CNC_LASER_STAGE.GENERATING_TOOLPATH,
                        progress: taskResult.progress
                    }));
                }
            },
            'taskProgress:generateGcode': (taskResult) => {
                if (taskResult.headType === 'laser') {
                    dispatch(editorActions.updateState('laser', {
                        stage: CNC_LASER_STAGE.GENERATING_GCODE,
                        progress: taskResult.progress
                    }));
                }
            }
        };

        Object.keys(controllerEvents).forEach(event => {
            controller.on(event, controllerEvents[event]);
        });
    },

    setBackgroundEnabled: (enabled) => {
        return {
            type: ACTION_SET_BACKGROUND_ENABLED,
            enabled
        };
    },

    setBackgroundImage: (filename, width, height, dx, dy) => (dispatch, getState) => {
        const state = getState().laser;
        const { svgModelGroup } = state;

        svgModelGroup.addImageBackgroundToSVG({
            modelID: 'image-background',
            uploadName: filename,
            transformation: {
                width: width,
                height: height,
                positionX: dx + width / 2,
                positionY: dy + height / 2
            }
        });

        const imgPath = `${DATA_PREFIX}/${filename}`;
        const texture = new THREE.TextureLoader().load(imgPath, () => {
            dispatch(editorActions.render('laser'));
        });
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1,
            map: texture
        });
        const geometry = new THREE.PlaneGeometry(width, height);
        const mesh = new THREE.Mesh(geometry, material);
        const x = dx + width / 2;
        const y = dy + height / 2;

        mesh.position.set(x, y, -0.001);
        const { group } = state.background;
        group.remove(...group.children);
        group.add(mesh);
        dispatch(actions.setBackgroundEnabled(true));
        dispatch(editorActions.render('laser'));
    },

    removeBackgroundImage: () => (dispatch, getState) => {
        const state = getState().laser;
        const { svgModelGroup } = state;
        svgModelGroup.clearImageBackground();
        const { group } = state.background;
        group.remove(...group.children);
        dispatch(actions.setBackgroundEnabled(false));
        dispatch(editorActions.render('laser'));
    }
};

export default function reducer(state = INITIAL_STATE, action) {
    const { headType, type } = action;
    if (headType === 'laser') {
        switch (type) {
            case ACTION_UPDATE_STATE: {
                return Object.assign({}, state, { ...action.state });
            }
            case ACTION_RESET_CALCULATED_STATE: {
                return Object.assign({}, state, {
                    isAllModelsPreviewed: false
                });
            }
            case ACTION_UPDATE_TRANSFORMATION: {
                return Object.assign({}, state, {
                    transformation: { ...state.transformation, ...action.transformation },
                    transformationUpdateTime: +new Date()
                });
            }
            case ACTION_UPDATE_GCODE_CONFIG: {
                return Object.assign({}, state, {
                    gcodeConfig: { ...state.gcodeConfig, ...action.gcodeConfig }
                });
            }
            case ACTION_UPDATE_CONFIG: {
                return Object.assign({}, state, {
                    config: { ...state.config, ...action.config }
                });
            }
            default:
                return state;
        }
    } else {
        switch (type) {
            case ACTION_SET_BACKGROUND_ENABLED: {
                return Object.assign({}, state, {
                    background: {
                        ...state.background,
                        enabled: action.enabled
                    }
                });
            }
            default:
                return state;
        }
    }
}
