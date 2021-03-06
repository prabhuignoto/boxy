<script lang="ts">
import Vue, { VNode, CreateElement } from "vue";
import DeleteBulkGQL from "../graphql/deleteBulk";
import MoveBulkGQL from "../graphql/moveBulk";
import CopyBulkGQL from "../graphql/copyBulk";
import CreateFolderGQL from "../graphql/createFolder";
import FolderGQL from "../graphql/folder";
import Axios from "axios";
import { Job, JobType } from "../modules/jobs";
import FileSaver from "file-saver";

import { Component } from "vue-property-decorator";
import { Action, Getter } from "vuex-class";
import { TreeNode, LockType } from "../modules/models";

interface Methods {
  runDeleteJob(j: Job): void;
  runMoveJob(j: Job): void;
  runCopyJob(j: Job): void;
  runUploadJob(j: Job): void;
  runCreateFolder(j: Job): void;
}

@Component({
  name: "JobRunner",
})
export default class extends Vue {
  @Action("startJob") startJob;
  @Action("completeJob") completeJob;
  @Action("failedJob") failedJob;
  @Action("updateJob") updateJob;
  @Action("showNotification") showNotification;
  @Action("lockItems") lockItems;
  @Action("unLockItems") unLockItems;
  @Action("refreshFileExplorer") refreshFileExplorer;
  @Action("addNodes") addNodes;
  @Action("deleteNodes") deleteNodes;
  @Action("removeChildrenNodes") removeChildrenNodes;
  @Action("addJob") addJob;
  @Action("startBulkOps") startBulkOps;
  @Action("stopBulkOps") stopBulkOps;
  @Action("updateLoadingState") updateLoadingState;

  @Getter("getExplorerPath") getExplorerPath;
  @Getter("getJobDataById") getJobDataById;

  mounted() {
    this.$store.watch(
      (state, getters) => getters.getAllNewJobs,
      jobs => {
        if (jobs.length) {
          jobs.forEach(job => {
            this.startJob(job.id);
            if (job.jobType === JobType.DELETE) {
              this.runDeleteJob(job);
            } else if (job.jobType === JobType.MOVE) {
              this.runMoveJob(job);
            } else if (job.jobType === JobType.COPY) {
              this.runCopyJob(job);
            } else if (job.jobType === JobType.CREATE_FOLDER) {
              this.runCreateFolder(job);
            } else if (job.jobType === JobType.UPLOAD) {
              this.runUploadJob(job);
            } else if (job.jobType === JobType.LIST_FILES) {
              this.runListJob(job);
            } else if (job.jobType === JobType.DOWNLOAD) {
              this.runDownloadJob(job);
            }
          });
        }
      }
    );
  }

  render(h: CreateElement): VNode {
    return h("div");
  }

  async runDeleteJob(job: Job) {
    const items = job.data && job.data.items;
    try {
      if (items) {
        this.startBulkOps({
          jobId: job.id,
          lockType: LockType.DELETE,
        });
        await this.$apollo.mutate({
          mutation: DeleteBulkGQL,
          variables: {
            args: {
              paths: items.map(item => item.pathLower),
              uiJobId: job.id,
            },
          },
        });
      }
    } catch (error) {
      this.stopBulkOps({ jobId: job.id });
      this.failedJob({
        id: job.id,
        reason: error,
      });
    }
  }

  async runMoveJob(job) {
    const items: { fromPath: string; toPath: string; id: string }[] =
      job.data && job.data.items;
    try {
      if (items) {
        this.startBulkOps({
          jobId: job.id,
          lockType: LockType.MOVE,
        });
        await this.$apollo.mutate({
          mutation: MoveBulkGQL,
          variables: {
            args: {
              entries: items,
              autorename: true,
              uiJobId: job.id,
            },
          },
        });
      }
    } catch (error) {
      this.stopBulkOps({ jobId: job.id });
      this.failedJob({
        id: job.id,
        reason: error,
      });
    }
  }

  async runCopyJob(job) {
    const items: { fromPath: string; toPath: string; id: string }[] =
      job.data && job.data.items;
    try {
      if (items) {
        this.startBulkOps({
          jobId: job.id,
          lockType: LockType.COPY,
        });
        await this.$apollo.mutate({
          mutation: CopyBulkGQL,
          variables: {
            args: {
              entries: items,
              autorename: true,
              uiJobId: job.id,
            },
          },
        });
      }
    } catch (error) {
      this.stopBulkOps({ jobId: job.id });
      this.failedJob({
        id: job.id,
        reason: error,
      });
    }
  }

  async runCreateFolder(job) {
    const { path, name } = job.data;
    try {
      await this.$apollo.mutate({
        mutation: CreateFolderGQL,
        variables: {
          args: {
            path: path,
            name: name,
            uiJobId: job.id,
          },
        },
      });
    } catch (error) {
      this.failedJob({
        id: job.id,
        reason: error,
      });
    }
  }

  async runUploadJob(job) {
    const { formData } = job.data;
    formData.append("uiJobId", job.id);
    try {
      await Axios.post(`${process.env.VUE_APP_API_SERVER}/upload`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: progressEvent => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          this.updateJob({
            id: job.id,
            data: {
              progress,
            },
          });
        },
      });
    } catch (error) {
      this.failedJob({
        id: job.id,
        reason: error,
      });
    }
  }

  async runListJob(job: Job) {
    const { path, treeId } = job.data;
    try {
      this.updateLoadingState(true);
      const { data } = await this.$apollo.query<{ files: { entries } }>({
        query: FolderGQL,
        variables: {
          args: {
            path,
            cursor: "",
            limit: 100,
          },
        },
        fetchPolicy: "no-cache",
      });
      this.updateLoadingState(false);
      const entries = data.files.entries;
      this.completeJob({ id: job.id });
      this.addNodes({
        treeId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nodes: (entries as any[]).map<TreeNode>(entry => ({
          name: entry.name,
          id: entry.id,
          path: entry.path_lower,
          type: entry.tag,
          serverModified: entry.server_modified,
          size: entry.size,
          hash: entry.content_hash,
          children: [],
        })),
        toPath: path,
      });
    } catch (error) {
      this.failedJob({
        id: job.id,
        reason: error,
      });
    }
  }

  async runDownloadJob(job: Job) {
    const items = job.data && job.data.items;
    try {
      if (items) {
        this.startBulkOps({
          jobId: job.id,
          lockType: LockType.DOWNLOAD,
        });

        const blobArray = await Axios.all(
          items.map(item =>
            Axios({
              url: `${process.env.VUE_APP_API_SERVER}/download`,
              params: {
                path: item.pathLower,
              },
              withCredentials: true,
              responseType: "blob",
            })
          )
        );
        blobArray.forEach((response, index) => {
          const blob = new Blob([response.data], {
            type: `${response.headers["content-type"]};charset=utf-8`,
          });

          const item = items[index];

          if (item && item.pathLower) {
            const name = item.pathLower.split("/").pop();

            FileSaver.saveAs(blob, name);
          }
        });
        this.stopBulkOps({ jobId: job.id });
      }
    } catch (error) {
      this.stopBulkOps({ jobId: job.id });
      this.failedJob({
        id: job.id,
        reason: error,
      });
    }
  }
}
</script>
