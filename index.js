/* eslint-disable no-warning-comments */
const { React, getModule } = require('powercord/webpack');
const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { findInReactTree } = require('powercord/util');
const { clipboard } = require('electron');

// ? https://help.ufile.io/en/article/upload-files-1p925sk/

/**
 * Upload files to the cloud
 * @link https://github.com/RazerMoon/uploadToCloud
 * @license MIT
 * @extends Plugin
 */
module.exports = class UploadToCloud extends Plugin {
  startPlugin () {
    this.patchSlateContext();
  }

  /**
 * Finalise the upload
 * @param {string} fuid
 * @param {File} file
 */
  finaliseUpload (fuid, file) {
  /** @type {XMLHttpRequest} */
    const request = new XMLHttpRequest.__proto__();

    const formData = new FormData();

    const filetype = file.name.split('/');

    formData.append('fuid', fuid);
    formData.append('file_name', file.name);
    formData.append('file_type', filetype[0]);
    formData.append('total_chunks', 1);

    request.open('POST', 'https://up.ufile.io/v1/upload/finalise');

    request.onload = () => {
      // eslint-disable-next-line eqeqeq
      if (request.status == 200) {
        powercord.api.notices.sendToast('uploadToCloud', { header: 'Upload Successful!',
          content: 'Link copied to clipboard.',
          type: 'success',
          timeout: 3000 });

        clipboard.writeText(JSON.parse(request.response).url);
      }
    };

    request.send(formData);
  }

  /**
 * Actually upload the file in chunks
 * @param {string} fuid
 * @param {File} file
 */
  uploadFile (fuid, file) {
  // TODO: Split large files in seperate chunks
  // TODO: Add progress indicator

    /** @type {XMLHttpRequest} */
    const request = new XMLHttpRequest.__proto__();

    const formData = new FormData();

    formData.append('chunk_index', 1);
    formData.append('fuid', fuid);
    formData.append('file', file);

    request.open('POST', 'https://up.ufile.io/v1/upload/chunk');

    request.onload = () => {
    // eslint-disable-next-line eqeqeq
      if (request.status == 200) {
        this.finaliseUpload(fuid, file);
      }
    };

    request.send(formData);
  }

  /**
 * Create the initial request and get FUID
 * @param {File} file
 */
  createUploadRequest (file) {
  /** @type {XMLHttpRequest} */
    const request = new XMLHttpRequest.__proto__();

    const formData = new FormData();
    formData.append('file_size', file.size);

    request.open('POST', 'https://up.ufile.io/v1/upload/create_session');

    request.onload = () => {
    // eslint-disable-next-line eqeqeq
      if (request.status == 200) {
        this.uploadFile(JSON.parse(request.response).fuid, file);
      }
    };

    request.send(formData);
  }

  async handleClick () {
    try {
      const [ fileHandle ] = await window.showOpenFilePicker();
      const file = await fileHandle.getFile();
      this.createUploadRequest(file);
    } catch (error) {
      this.log('Aborted file pick');
    }
  }

  async patchSlateContext () {
    const Menu = await getModule((m) => (m.__powercordOriginal_default || m.default)?.displayName === 'Menu');
    const CM = await getModule((m) => (m.__powercordOriginal_default || m.default)?.displayName === 'SlateTextAreaContextMenu');

    inject('uploadtocloud-slatecm-patch', CM, 'default', (_req, res) => {
      if (!res) {
        return res;
      }

      const hasUploadButton = findInReactTree(res.children, child => child.props && child.props.id === 'upload');

      if (!hasUploadButton) {
        const uploadButton = React.createElement(Menu.MenuItem, {
          id: 'upload',
          label: 'Upload to Cloud',
          action: () => this.handleClick()
        });

        res.props.children.splice(res.props.children.length - 1, 0, [ React.createElement(Menu.MenuSeparator), React.createElement(Menu.MenuGroup, {}, uploadButton) ]);
      }

      return res;
    });
  }

  pluginWillUnload () {
    uninject('uploadtocloud-slatecm-patch');
  }
};