'use babel';

import NetsuitefilesView from './netsuitefiles-view';
import {
  CompositeDisposable
} from 'atom';

import {
  Base64
} from './encode.js';


export default {

  netsuitefilesView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.netsuitefilesView = new NetsuitefilesView(state.netsuitefilesViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.netsuitefilesView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'netsuitefiles:upload': () => this.upload()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.netsuitefilesView.destroy();
  },

  serialize() {
    return {
      netsuitefilesViewState: this.netsuitefilesView.serialize()
    };
  },

  upload() {

    console.log('demo');

    let config = atom.config;

    var folder = config.get('netsuitefiles.Folder');
    var url = config.get('netsuitefiles.NetsuiteWebService');
    var email = config.get('netsuitefiles.Email');
    var password = config.get('netsuitefiles.Password');
    var aplication = config.get('netsuitefiles.AplicationID');


    console.log('folder : ' + folder);
    console.log('url : ' + url);

    if (!url) {

      atom.notifications.addError('The Web service was not defined', {
        message: "Message"
      });

    } {

      let editor = atom.workspace.getActiveTextEditor();

      var content = Base64.encode(editor.getText());
      var title = editor.getTitle();

      console.log('File: ' + title);

      if (title == 'untitled') {
        atom.notifications.addError('The file do not have title.', {
          message: "Message"
        });
      } else {

        var context = {
          content: content,
          file: title,
          folder: folder,
          aplication: aplication,
          email: email,
          password: password
        }

        var https = new XMLHttpRequest();
        https.open("POST", url, false);
        https.send(JSON.stringify(context));

        if (https.status == '200') {
          try {
            var result = JSON.parse(https.response);

            if (result.status) {
              atom.notifications.addSuccess(result.details, {
                message: "Message"
              });
            } else {
              atom.notifications.addError(result.details, {
                message: "Message"
              });
            }

          } catch (err) {
            atom.notifications.addError('the response is invalid. Try again.', {
              message: "Message"
            });
          }

        } else {
          atom.notifications.addError('The conection had a problem. Try again.', {
            message: "Message"
          });
        }

      }
    }
    // return (
    //   this.modalPanel.isVisible() ?
    //   this.modalPanel.hide() :
    //   this.modalPanel.show()
    // );
  }

};
