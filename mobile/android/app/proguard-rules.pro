# Add project specific ProGuard rules here.
# https://developer.android.com/guide/developing/tools/proguard.html

-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.swmansion.** { *; }
-keep class com.mrousavy.** { *; }
-keep class com.brentvatne.** { *; }

-dontwarn com.facebook.react.**
