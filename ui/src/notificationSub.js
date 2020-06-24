import gql from "graphql-tag";
import uniqid from "uniqid";

export default {
  resx_deleted: {
    query: gql`
      subscription {
        resxDeleted {
          success
          name
        }
      }
    `,
    result({ data: { resxDeleted } }) {
      if (resxDeleted.success) {
        this.showNotification({
          type: "info",
          notificationTitle: "Deleted resource",
          id: uniqid("notification-msg-"),
          message: `Deleted ${resxDeleted.name.split("/").pop()} successfully.`,
        });
      } else {
        this.showNotification({
          type: "Error",
          notificationTitle: "Failure",
          id: uniqid("notification-msg-"),
          message: `Unable to delete ${resxDeleted.name
            .split("/")
            .pop()} at the moment.`,
        });
      }
    },
  },
  resx_copied: {
    query: gql`
      subscription {
        resxCopied {
          success
          name
        }
      }
    `,
    result({ data: { resxCopied } }) {
      if (resxCopied.success) {
        this.showNotification({
          type: "info",
          notificationTitle: "Copy resource",
          id: uniqid("notification-msg-"),
          message: `Copied ${resxCopied.name.split("/").pop()} successfully.`,
        });
      } else {
        this.showNotification({
          type: "Error",
          notificationTitle: "Failure",
          id: uniqid("notification-msg-"),
          message: `Unable to copy ${resxCopied.name.split("/").pop()}.`,
        });
      }
    },
  },
  resx_moved: {
    query: gql`
      subscription {
        resxMoved {
          success
          name
        }
      }
    `,
    result({ data: { resxMoved } }) {
      if (resxMoved.success) {
        this.showNotification({
          type: "info",
          notificationTitle: "Move resource",
          id: uniqid("notification-msg-"),
          message: `Moved ${resxMoved.name.split("/").pop()} successfully.`,
        });
        this.refetchData(true);
        this.refreshFileExplorer({
          status: true,
          path: this.getExplorerPath,
        });
      } else {
        this.showNotification({
          type: "Error",
          notificationTitle: "Failure",
          id: uniqid("notification-msg-"),
          message: `Unable to move ${resxMoved.name.split("/").pop()}.`,
        });
      }
    },
  },
};
