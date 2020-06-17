import Vue from "vue";
import Vuex from "vuex";
import File from "./modules/file";
import Folder from "./modules/folder";
import List from "./modules/list";
import MoveCopy from "./modules/move-copy";
import Notification from "./modules/notification";
import Upload from "./modules/upload";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    mvCopy: MoveCopy,
    folder: Folder,
    upload: Upload,
    file: File,
    list: List,
    notification: Notification,
  },
  state: {
    explorer: {
      path: "",
    },
    fileExplorer: {
      activeFileNode: {},
      refresh: {
        status: false,
        path: "",
      },
    },
    modal: {
      isActive: false,
      componentToRender: "",
      title: "",
      disableHeader: false,
      disableCloseBtn: false,
      width: 450,
    },
    treeView: {
      data: [],
    },
    workFlowOrigin: "",
    notification: {
      messages: [],
      unRead: [],
      read: [],
    },
  },
  mutations: {
    updatePath(state, { path }) {
      state.explorer.path = path;
    },
    updateExplorerNode(state, { node }) {
      state.fileExplorer.activeFileNode = node;
    },
    updateModalState(
      state,
      {
        status,
        componentToRender,
        title,
        disableHeader,
        disableCloseBtn,
        width,
      }
    ) {
      state.modal.isActive = status;
      state.modal.componentToRender = componentToRender;
      state.modal.title = title;
      state.modal.disableHeader = disableHeader;
      state.modal.disableCloseBtn = disableCloseBtn;
      state.modal.width = width;
    },
    updateModalTitle(state, { title }) {
      state.modal.title = title;
    },
    updateTreeViewData(state, { data }) {
      state.treeView.data = data.map(x =>
        Object.assign({}, x, {
          selected: false,
        })
      );
    },
    updateWorkflowOrigin(state, { origin }) {
      state.workFlowOrigin = origin;
    },
    refreshFileExplorer(state, { status, path }) {
      state.fileExplorer.refresh = {
        status,
        path,
      };
    },
  },
  actions: {
    updatePath({ commit }, path) {
      commit({
        type: "updatePath",
        path,
      });
    },
    updateExplorerNode({ commit }, node) {
      commit({
        type: "updateExplorerNode",
        node,
      });
    },
    updateModalTitle({ commit }, title) {
      commit({
        type: "updateModalTitle",
        title,
      });
    },
    updateModalState(
      { commit },
      {
        status,
        componentToRender,
        title,
        disableHeader,
        disableCloseBtn,
        width,
      }
    ) {
      commit({
        type: "updateModalState",
        status,
        componentToRender,
        title,
        disableHeader,
        disableCloseBtn,
        width,
      });
    },
    updateTreeViewData({ commit }, data) {
      commit({
        type: "updateTreeViewData",
        data,
      });
    },
    updateWorkflowOrigin({ commit }, origin) {
      commit({
        type: "updateWorkflowOrigin",
        origin,
      });
    },
    refreshFileExplorer({ commit }, { status, path }) {
      commit({
        type: "refreshFileExplorer",
        status,
        path,
      });
    },
  },
  getters: {
    isModalActive: state => state.modal.isActive,
    getPopupComponent: state => state.modal.componentToRender,
    getPopupTitle: state => state.modal.title,
    getIsDisableHeader: state => state.modal.disableHeader,
    getExplorerPath: state => state.explorer.path,
    getDisableCloseBtn: state => state.modal.disableCloseBtn,
    getWorkflowOrigin: state => state.workFlowOrigin,
    getRefreshFileExplorer: state => state.fileExplorer.refresh,
    getModalWidth: state => state.modal.width,
  },
});
