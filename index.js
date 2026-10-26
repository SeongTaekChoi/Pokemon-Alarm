/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { RingingScreen } from './src/screens/RingingScreen';

AppRegistry.registerComponent(appName, () => App);
// Rendered by AlarmActivity over the lock screen when an alarm rings.
AppRegistry.registerComponent('AlarmRinging', () => RingingScreen);
