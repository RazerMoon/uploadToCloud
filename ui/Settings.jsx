const { React } = require('powercord/webpack');
const { TextInput } = require('powercord/components/settings');

// eslint-disable-next-line no-warning-comments
// TODO: Make the channel items more distinct/seperate from the actual settings
// eslint-disable-next-line no-warning-comments
// TODO: Add avatar preview
module.exports = ({ getSetting, updateSetting }) => {
  const [ chunkSize, setchunkSize ] = React.useState(getSetting('chunkSize', 5e+6).toString());

  const isValid = (value) => !isNaN(value) && value >= 1e+6 && value <= 1e+9; // Bigger than 1 MB smaller than 1 GB

  return (
    <div>
      <TextInput
        note={`Size of the chunks to be uploaded in bytes (5 MB recommended, 1 MB minimum), currently ${!isNaN(chunkSize) ? chunkSize / 1e+6 : 'NaN'} MB.`}
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
    </div>
  );
};
