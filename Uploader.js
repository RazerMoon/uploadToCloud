/* eslint-disable no-warning-comments */
const { clipboard } = require('electron');

/**
 * Controls the uploading process.
 */
module.exports = class Uploader {
  /**
   * Set conditions.
   * @param {string} provider
   * @param {number} chunkSize
   */
  constructor (provider, chunkSize) {
    this.provider = provider;
    this.chunkSize = chunkSize;
    this.currentChunk = 0;
  }

  /**
   * Finalise the upload
   * @param {File} file
   * @param {object} optParams
   */
  finaliseUpload (file, optParams = {}) {
    const { fuid, lastResponse } = optParams;

    /** @type {XMLHttpRequest} */
    const request = new XMLHttpRequest.__proto__();

    const formData = new FormData();

    let filetype;

    request.onload = () => {
    // eslint-disable-next-line eqeqeq
      if (request.status == 200) {
        powercord.api.notices.sendToast('uploadToCloud', {
          header: 'Upload Successful!',
          content: 'Link copied to clipboard.',
          type: 'success',
          timeout: 3000 }
        );

        clipboard.writeText(JSON.parse(request.response).url);
      } else {
        powercord.api.notices.sendToast('uploadToCloud', {
          header: 'Upload Failure!',
          content: 'Something went wrong while finalising the upload.',
          type: 'error',
          timeout: 3000 });
      }
    };

    switch (this.provider) {
      case 'UFile.io':
        filetype = file.name.split('/');

        formData.append('fuid', fuid);
        formData.append('file_name', file.name);
        formData.append('file_type', filetype[0]);
        formData.append('total_chunks', this.currentChunk + 1);

        request.open('POST', 'https://up.ufile.io/v1/upload/finalise');

        request.send(formData);
        break;

      case 'GoFile.io':
        powercord.api.notices.sendToast('uploadToCloud', {
          header: 'Upload Successful!',
          content: 'Link copied to clipboard.',
          type: 'success',
          timeout: 3000 }
        );

        clipboard.writeText(lastResponse.data.downloadPage);
        break;

      default:
        break;
    }
  }

  /**
   * Actually upload the file in chunks
   * @param {File} file
   * @param {object} optParams
   */
  uploadFile (file, optParams = {}) {
  // TODO: Add progress indicator

    const { fuid, server } = optParams;

    /** @type {XMLHttpRequest} */
    const request = new XMLHttpRequest.__proto__();

    const formData = new FormData();

    let lastChunk;

    let providerUrl;

    switch (this.provider) {
      case 'UFile.io':
        formData.append('chunk_index', this.currentChunk + 1);
        formData.append('fuid', fuid);

        lastChunk = (file.size - (this.chunkSize * this.currentChunk)) < this.chunkSize;

        if (!lastChunk) {
          formData.append('file', file.slice(this.chunkSize * this.currentChunk, this.chunkSize * (this.currentChunk + 1)));
        } else {
          formData.append('file', file.slice(this.chunkSize * this.currentChunk, file.size));
        }

        providerUrl = 'https://up.ufile.io/v1/upload/chunk';
        break;

      case 'GoFile.io':
        formData.append('file', file);

        providerUrl = `https://${server}.gofile.io/uploadFile`;
        break;

      default:
        break;
    }

    request.open('POST', providerUrl);

    request.onload = () => {
    // eslint-disable-next-line eqeqeq
      if (request.status == 200) {
        switch (this.provider) {
          case 'UFile.io':
            if (!lastChunk) {
              this.currentChunk++;
              this.uploadFile(file, { fuid });
            } else {
              this.finaliseUpload(file, { fuid });
            }
            break;

          case 'GoFile.io':
            this.finaliseUpload(null, { lastResponse: JSON.parse(request.response) });
            break;

          default:
            break;
        }
      } else {
        powercord.api.notices.sendToast('uploadToCloud', {
          header: 'Upload Failure!',
          content: 'Something went wrong while uploading.',
          type: 'error',
          timeout: 3000 }
        );
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
        this.currentChunk = 0;
        this.uploadFile(file, { fuid: JSON.parse(request.response).fuid });
      } else {
        powercord.api.notices.sendToast('uploadToCloud', {
          header: 'Upload Failure!',
          content: 'Something went wrong went creating an upload request.',
          type: 'error',
          timeout: 3000 });
      }
    };

    request.send(formData);
  }

  /**
   * Returns the best server available to receive files.
   * @param {File} file
   */
  getServer (file) {
  /** @type {XMLHttpRequest} */
    const request = new XMLHttpRequest.__proto__();

    request.open('GET', 'https://api.gofile.io/getServer');

    request.onload = () => {
    // eslint-disable-next-line eqeqeq
      if (request.status == 200) {
        this.uploadFile(file, { server: JSON.parse(request.response).data.server });
      } else {
        powercord.api.notices.sendToast('uploadToCloud', {
          header: 'Upload Failure!',
          content: 'Something went wrong when trying to get a server.',
          type: 'error',
          timeout: 3000
        });
      }
    };

    request.send();
  }

  /**
   * Initialize upload and decide on method.
   * @param {File} file
   */
  initUpload (file) {
    switch (this.provider) {
      case 'UFile.io':
      // ? https://help.ufile.io/en/article/upload-files-1p925sk/

        this.createUploadRequest(file);
        break;

      case 'GoFile.io':
      // ? https://gofile.io/api

        this.getServer(file);
        break;

      default:
        powercord.api.notices.sendToast('uploadToCloud', {
          header: 'Upload Failure!',
          content: 'No this.provider matched the setting.',
          type: 'error',
          timeout: 3000
        });
        break;
    }
  }
};
