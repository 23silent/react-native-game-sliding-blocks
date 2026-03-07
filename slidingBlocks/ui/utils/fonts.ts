import { matchFont } from '@shopify/react-native-skia'
import { Platform } from 'react-native'

const fontFamily = Platform.select({
  ios: 'Helvetica',
  default: 'sans-serif'
})

export const fonts = {
  label: matchFont({ fontFamily, fontSize: 11 }),
  score: matchFont({ fontFamily, fontSize: 16, fontWeight: '700' }),
  scoreLarge: matchFont({ fontFamily, fontSize: 20 }),
  title: matchFont({ fontFamily, fontSize: 28, fontWeight: '700' }),
  button: matchFont({ fontFamily, fontSize: 18, fontWeight: '600' }),
  buttonSmall: matchFont({ fontFamily, fontSize: 15, fontWeight: '600' })
}
