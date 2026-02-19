package expo.modules.apkparser

import android.content.pm.PackageManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ApkParserModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ApkParser")

    // AsyncFunction automatically runs on a separate thread provided by Expo
    AsyncFunction("parseApk") { filePath: String ->
      val context = appContext.reactContext ?: return@AsyncFunction null
      val pm = context.packageManager
      
      // Android's getPackageArchiveInfo is a heavy I/O call
      val packageInfo = pm.getPackageArchiveInfo(filePath, PackageManager.GET_PERMISSIONS)
      
      if (packageInfo != null) {
        mapOf(
          "package_name" to packageInfo.packageName,
          "version_name" to packageInfo.versionName,
          "permissions" to (packageInfo.requestedPermissions?.toList() ?: emptyList<String>())
        )
      } else {
        null
      }
    }
  }
}