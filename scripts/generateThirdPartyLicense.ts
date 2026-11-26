/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-require-imports */
// @ts-nocheck
'use strict'

const path = require('path')
const fs = require('fs')
const thirdPartyChecker = require('./thirdPartyChecker.js')
const desktopRoot = path.resolve(__dirname, '..', 'packages/desktop')

thirdPartyChecker.getLicenses(desktopRoot, (err, packages) => {
  if (err) {
    console.log(`[ERROR] ${err}`)
    return
  }

  let summary = ''
  let licenseList = ''
  let index = 1
  const addedKeys = {}

  // Vendored sources are shipped without an entry in the dependency graph.
  packages['@hfelix/electron-localshortcut@4.0.1 (vendored)'] = {
    licenses: 'MIT',
    licenseText: fs.readFileSync(path.join(desktopRoot, 'src/common/localShortcut/LICENSE'), 'utf8')
  }

  Object.keys(packages).forEach((key) => {
    let packageName = key
    const nameRegex = /(^.+)(?:@)/.exec(key)
    if (nameRegex && nameRegex[1]) {
      packageName = nameRegex[1]
    }

    if (Object.hasOwn(addedKeys, packageName)) {
      return
    }
    addedKeys[packageName] = 1

    const { licenses, licenseText: inlineText, licenseFile, repository } = packages[key]
    // license-checker only reports the path of the licence file, not its text;
    // reading it here keeps the notice from printing "undefined". When no licence
    // file exists it points at the README instead, which is not a notice.
    let licenseText = inlineText
    if (!licenseText && licenseFile && !/readme/i.test(path.basename(licenseFile))) {
      licenseText = fs.readFileSync(licenseFile, 'utf8').trim()
    }
    if (!licenseText) {
      licenseText = `License: ${licenses}. The package ships no licence file${repository ? `; see ${repository}` : ''}.`
    }
    summary += `${index++}. ${packageName} (${licenses})\n`
    licenseList += `# ${packageName} (${licenses})
-------------------------------------------------\

${licenseText}
\n\n
`
  })

  const output = `# Third Party Notices
-------------------------------------------------

This file contains all third-party packages that are bundled and shipped with MarkText.

-------------------------------------------------
# Summary
-------------------------------------------------

${summary}

-------------------------------------------------
# Licenses
-------------------------------------------------

${licenseList}
`

  fs.writeFileSync(path.resolve(desktopRoot, 'build', 'THIRD-PARTY-LICENSES.txt'), output)
  console.log('THIRD-PARTY-LICENSES.txt generated successfully.')
})
