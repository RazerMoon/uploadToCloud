/* eslint-disable no-warning-comments */
const { React, getModule } = require('powercord/webpack');
const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { findInReactTree } = require('powercord/util');
const Settings = require('./ui/Settings.jsx');

const Uploader = require('./Uploader');

/**
 * Upload files to the cloud
 * @link https://github.com/RazerMoon/uploadToCloud
 * @license MIT
 * @extends Plugin
 */
module.exports = class UploadToCloud extends Plugin {
  startPlugin () {
    powercord.api.settings.registerSettings(this.entityID, {
      category: this.entityID,
      label: 'Upload to Cloud',
      render: Settings
    });
    this.patchAttachMenu();
  }

  async handleClick () {
    try {
      const [ fileHandle ] = await window.showOpenFilePicker();
      const file = await fileHandle.getFile();

      const uploader = new Uploader(this.settings.get('provider', 'UFile.io'), this.settings.get('chunkSize', 5e+6));
      uploader.initUpload(file);
    } catch (error) {
      this.log('Aborted file pick');
    }
  }

  async patchAttachMenu () {
    const Menu = await getModule((m) => (m.__powercordOriginal_default || m.default)?.displayName === 'Menu');
    const mod = await getModule((m) => (m.__powercordOriginal_default || m.default)?.displayName === 'ChannelAttachMenu');

    inject('uploadtocloud-attachmenu-patch', mod, 'default', (_req, res) => {
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

        res.props.children.splice(res.props.children.length - 1, 0, [ React.createElement(Menu.MenuGroup, {}, uploadButton), React.createElement(Menu.MenuSeparator) ]);
      }

      return res;
    });
  }

  pluginWillUnload () {
    uninject('uploadtocloud-attachmenu-patch');
    powercord.api.settings.unregisterSettings(this.entityID);
  }
};
