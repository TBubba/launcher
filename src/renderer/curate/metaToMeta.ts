import { IGameInfo, IAdditionalApplicationInfo } from '../../shared/game/interfaces';

/**
 * Convert game and its additional applications into a raw object representation in the curation format.
 * @param game Game to convert.
 * @param addApps Additional applications of the game.
 */
export function convertToCurationMeta(game: IGameInfo, addApps?: IAdditionalApplicationInfo[]): CurationFormatMeta {
  const parsed: CurationFormatMeta = {};
  // Game meta
  parsed['Title']                = game.title;
  parsed['Series']               = game.series;
  parsed['Developer']            = game.developer;
  parsed['Publisher']            = game.publisher;
  parsed['Play Mode']            = game.playMode;
  parsed['Release Date']         = game.releaseDate;
  parsed['Version']              = game.version;
  parsed['Languages']            = game.language;
  parsed['Extreme']              = game.extreme ? 'Yes' : 'No';
  parsed['Tags']                 = game.genre;
  parsed['Source']               = game.source;
  parsed['Platform']             = game.platform;
  parsed['Status']               = game.status;
  parsed['Application Path']     = game.applicationPath;
  parsed['Launch Command']       = game.launchCommand;
  parsed['Game Notes']           = game.notes;
  parsed['Original Description'] = game.originalDescription;
  // Add-apps meta
  const parsedAddApps: CurationFormatAddApps = {};
  if (addApps) {
    for (let i = 0; i < addApps.length; i++) {
      const addApp = addApps[i];
      if (addApp.applicationPath === ':extras:') {
        parsedAddApps['Extras'] = addApp.commandLine;
      } else if (addApp.applicationPath === ':message:') {
        parsedAddApps['Message'] = addApp.commandLine;
      } else {
        let heading = addApp.name;
        // Check if the property name is already in use
        if (parsedAddApps[heading] !== undefined) {
          // Look for an available name (by appending a number after it)
          let index = 2;
          while (true) {
            const testHeading = `${heading} (${index})`;
            if (parsedAddApps[testHeading] === undefined) {
              heading = testHeading;
              break;
            }
            index += 1;
          }
        }
        // Add add-app
        parsedAddApps[heading] = {
          'Heading': addApp.name,
          'Application Path': addApp.applicationPath,
          'Launch Command': addApp.commandLine,
        };
      }
    }
  }
  parsed['Additional Applications'] = parsedAddApps;
  // Return
  return parsed;
}

type CurationFormatMeta = {
  'Application Path'?: string;
  'Developer'?: string;
  'Extreme'?: string;
  'Game Notes'?: string;
  'Languages'?: string;
  'Launch Command'?: string;
  'Original Description'?: string;
  'Play Mode'?: string;
  'Platform'?: string;
  'Publisher'?: string;
  'Release Date'?: string;
  'Series'?: string;
  'Source'?: string;
  'Status'?: string;
  'Tags'?: string;
  'Title'?: string;
  'Version'?: string;
  'Additional Applications'?: CurationFormatAddApps;
};

type CurationFormatAddApps = {
  [key: string]: CurationFormatAddApp;
} & {
  'Extras'?: string;
  'Message'?: string;
};

type CurationFormatAddApp = {
  'Application Path'?: string;
  'Heading'?: string;
  'Launch Command'?: string;
};
