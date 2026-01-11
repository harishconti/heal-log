# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ===== REACT NATIVE CORE =====
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }

# react-native-gesture-handler
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.gesturehandler.react.** { *; }

# ===== EXPO MODULES =====
-keep class expo.modules.** { *; }
-keep class expo.** { *; }

# expo-secure-store
-keep class com.facebook.crypto.** { *; }

# expo-haptics
-keep class expo.modules.haptics.** { *; }

# expo-image-manipulator
-keep class expo.modules.imagemanipulator.** { *; }

# ===== WATERMELONDB =====
-keep class com.nozbe.watermelondb.** { *; }
-keep class com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }

# ===== ASYNC STORAGE =====
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# ===== OKHTTP & NETWORKING =====
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-keep class okio.** { *; }

# ===== JSR 305 ANNOTATIONS =====
-dontwarn javax.annotation.**

# ===== KEEP JAVASCRIPT INTERFACES =====
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ===== PERFORMANCE OPTIMIZATIONS =====
# Remove logging in release builds
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
}

# Optimize enum switches
-optimizations code/simplification/arithmetic,code/simplification/cast,field/*,class/merging/*

# Add any project specific keep options here:
