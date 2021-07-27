const { React } = require('powercord/webpack');
const { TextInput, SelectInput } = require('powercord/components/settings');

module.exports = ({ getSetting, updateSetting }) => {
  const [ chunkSize, setchunkSize ] = React.useState(getSetting('chunkSize', 5e+6).toString());
  const [ provider, setProvider ] = React.useState(getSetting('provider', 'UFile.io'));

  const isValid = (value) => !isNaN(value) && value >= 1e+6 && value <= 1e+9; // Bigger than 1 MB smaller than 1 GB

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
    </div>
  );
};
