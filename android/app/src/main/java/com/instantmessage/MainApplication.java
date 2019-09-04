package com.instantmessage;

import android.app.Application;

import android.os.Bundle;
import com.duanglink.rnmixpush.MixPushReactPackage;
import com.facebook.react.ReactApplication;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import org.wonday.pdf.RCTPdfView;
import com.RNFetchBlob.RNFetchBlobPackage;
//import com.jeepeng.react.xgpush.PushPackage;
import com.philipphecht.RNDocViewerPackage;
import com.filepicker.FilePickerPackage;
import com.cnull.apkinstaller.ApkInstallerPackage;
import com.rnfs.RNFSPackage;
import com.rnim.rn.audio.ReactNativeAudioPackage;
import com.zmxv.RNSound.RNSoundPackage;
import com.imagepicker.ImagePickerPackage;
import com.benwixen.rnfilesystem.RNFileSystemPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import me.neo.react.StatusBarPackage;
import com.instantmessage.NetworkPackage;

import java.util.Arrays;
import java.util.List;

import com.learnium.RNDeviceInfo.RNDeviceInfo;
import org.pgsqlite.SQLitePluginPackage;
import org.reactnative.camera.RNCameraPackage;
import com.rnxmpp.RNXMPPPackage;

public class MainApplication extends Application implements ReactApplication {

    private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
            return Arrays.<ReactPackage>asList(
                    new MainReactPackage(),
                    new RNGestureHandlerPackage(),
                    new RCTPdfView(),
                    new RNFetchBlobPackage(),
//            new PushPackage(),
                    new RNDocViewerPackage(),
                    new FilePickerPackage(),
                    new ApkInstallerPackage(),
                    new RNFSPackage(),
                    new ReactNativeAudioPackage(),
                    new RNSoundPackage(),
                    new ImagePickerPackage(),
                    new RNFileSystemPackage(),
                    new VectorIconsPackage(),
                    new RNXMPPPackage(),
                    new RNDeviceInfo(),
                    new SQLitePluginPackage(),
                    new IMPackage(),
                    new StatusBarPackage(),
                    new RNCameraPackage(),
                    new NetworkPackage(),
                    new MixPushReactPackage()
            );
        }

        @Override
        protected String getJSMainModuleName() {
            return "index";
        }
    };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        SoLoader.init(this, /* native exopackage */ false);
    }
}
