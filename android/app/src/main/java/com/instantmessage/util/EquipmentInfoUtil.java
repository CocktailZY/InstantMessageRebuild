package com.instantmessage.util;
import android.app.Activity;
import android.os.storage.StorageManager;
import android.util.Log;

import com.instantmessage.IMModule;

import java.io.File;
import java.lang.reflect.Method;
import static android.content.ContentValues.TAG;
import static android.content.Context.STORAGE_SERVICE;

/**
 * Created by Administrator on 2017/8/22.
 */

public class EquipmentInfoUtil {

    // 获取主存储卡路径
    public static String getPrimaryStoragePath(Activity mActivity) {
        try {
            StorageManager sm = (StorageManager) mActivity.getSystemService(STORAGE_SERVICE);
            Method getVolumePathsMethod = StorageManager.class.getMethod("getVolumePaths");
            String[] paths = (String[]) getVolumePathsMethod.invoke(sm);
            // first element in paths[] is primary storage path
            return paths[0];
        } catch (Exception e) {
            Log.e(TAG, "getPrimaryStoragePath() failed", e);
        }
        return null;
    }


}
