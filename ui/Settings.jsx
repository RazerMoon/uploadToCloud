const { React } = require('powercord/webpack');
const { TextInput, SelectInput, ButtonItem } = require('powercord/components/settings');

module.exports = ({ getSetting, updateSetting }) => {
  const [ chunkSize, setchunkSize ] = React.useState(getSetting('chunkSize', 5e+6).toString());
  const [ provider, setProvider ] = React.useState(getSetting('provider', 'UFile.io'));
  const [ urlToCheck, setUrlToCheck ] = React.useState('https://api.gofile.io/getServer');

  const URLRegex = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/);

  const isValid = (value) => !isNaN(value) && value >= 1e+6 && value <= 1e+9; // Bigger than 1 MB smaller than 1 GB

  const isValidURL = (value) => URLRegex.test(value);

  const options = [
    { label: 'UFile.io (Chunking)',
      value: 'UFile.io' },
    { label: 'GoFile.io',
      value: 'GoFile.io' }
  ];

  return (
    <div>
      <TextInput
        note={`Size of the chunks (for providers who support them) to be uploaded in bytes (5 MB recommended, 1 MB minimum), currently ${!isNaN(chunkSize) ? chunkSize / 1e+6 : 'NaN'} MB.`}
        defaultValue={chunkSize}
        style={isValid(chunkSize) ? { } : { borderColor: 'red' }}
        onChange={(value) => {
          setchunkSize(value);

          if (isValid(value)) {
            updateSetting('chunkSize', Number(value));
          }
        }}
      >
      Chunk size
      </TextInput>

      <SelectInput
        value={provider}
        defaultValue={provider}
        note="Where you want to upload the files."
        onChange={(val) => {
          setProvider(val);
          updateSetting('provider', val.value);
        }}
        options={options}
        required={true}
        searchable={false}
      >
        Provider
      </SelectInput>

      <TextInput
        note="Check if an upload URL can be used by Discord (make sure to include http/https)"
        defaultValue={urlToCheck}
        style={isValidURL(urlToCheck) ? { } : { borderColor: 'red' }}
        onChange={(value) => {
          setUrlToCheck(value);
        }}
      >
      URL Checker
      </TextInput>
      <ButtonItem
        button="Do it"
        onClick={async () => {
          try {
            const request = await fetch(urlToCheck);

            if (request.status !== 404) {
              powercord.api.notices.sendToast('uploadToCloud', {
                header: 'Link works!',
                content: 'You can suggest it in the repo.',
                type: 'success',
                timeout: 3000 }
              );
            } else {
              powercord.api.notices.sendToast('uploadToCloud', {
                header: 'Link doesn\'t work!',
                content: 'Don\'t suggest it.',
                type: 'error',
                timeout: 3000 }
              );
            }
          } catch (err) {
            powercord.api.notices.sendToast('uploadToCloud', {
              header: 'Link doesn\'t work!',
              content: 'Don\'t suggest it.',
              type: 'error',
              timeout: 3000 }
            );
          }
        }}
      >
        Check URL
      </ButtonItem>
    </div>
  );
};
