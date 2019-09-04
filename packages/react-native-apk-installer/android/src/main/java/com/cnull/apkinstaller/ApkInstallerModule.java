package com.cnull.apkinstaller;

import android.os.Build;
import android.support.v4.content.FileProvider;
import android.util.Log;
import android.widget.Toast;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.HashMap;
import java.util.Map;

import android.content.Intent;
import android.net.Uri;
import java.io.File;

public class ApkInstallerModule extends ReactContextBaseJavaModule {
  private ReactApplicationContext _context = null;

  // private static final String DURATION_SHORT_KEY = "SHORT";
  // private static final String DURATION_LONG_KEY = "LONG";

  public ApkInstallerModule(ReactApplicationContext reactContext) {
    super(reactContext);
    _context = reactContext;
  }

  @Override
  public String getName() {
    return "ApkInstaller";
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    // constants.put(DURATION_SHORT_KEY, Toast.LENGTH_SHORT);
    // constants.put(DURATION_LONG_KEY, Toast.LENGTH_LONG);
    return constants;
  }

  @ReactMethod
  // public void show(String message, int duration) {
  public void test(String message) {
    Toast.makeText(getReactApplicationContext(), message, Toast.LENGTH_LONG).show();
  }

  @ReactMethod
  public void install(String path) {
      String cmd = "chmod 777 " +path;
      try {
          Runtime.getRuntime().exec(cmd);
      } catch (Exception e) {
          e.printStackTrace();
      }

      Intent intent = new Intent(Intent.ACTION_VIEW);
      intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);


      File file = new File(path);
      Uri fileUri = Uri.fromFile(file);


      if (Build.VERSION.SDK_INT >= 24) {
          fileUri = FileProvider.getUriForFile(_context, _context.getPackageName() + ".apkProvider",
                  file);
      }
      intent.setDataAndType(fileUri, "application/vnd.android" + ".package-archive");
      intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
      _context.startActivity(intent);

  }
}
