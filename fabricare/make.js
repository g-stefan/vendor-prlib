// Created by Grigore Stefan <g_stefan@yahoo.com>
// Public domain (Unlicense) <http://unlicense.org>
// SPDX-FileCopyrightText: 2022-2024 Grigore Stefan <g_stefan@yahoo.com>
// SPDX-License-Identifier: Unlicense

Fabricare.include("vendor");

messageAction("make");

if (Shell.fileExists("temp/build.done.flag")) {
	return;
};

if (!Shell.directoryExists("source")) {
	exitIf(Shell.system("7z x -aoa archive/" + Project.vendor + ".7z"));
	Shell.rename(Project.vendor, "source");
};

Shell.mkdirRecursivelyIfNotExists("output");
Shell.mkdirRecursivelyIfNotExists("output/bin");
Shell.mkdirRecursivelyIfNotExists("output/include");
Shell.mkdirRecursivelyIfNotExists("output/lib");
Shell.mkdirRecursivelyIfNotExists("temp");

Shell.mkdirRecursivelyIfNotExists("temp/cmake");
Shell.mkdirRecursivelyIfNotExists("temp/output");

if (!Shell.fileExists("temp/build.config.flag")) {
	Shell.setenv("CC","cl.exe");
	Shell.setenv("CXX","cl.exe");

	Shell.copyFile("fabricare/source/deskew.cpp","source/src/deskew/deskew.cpp");

	cmdConfig="cmake";
	cmdConfig+=" ../../source";
	cmdConfig+=" -G \"Ninja\"";
	cmdConfig+=" -DCMAKE_BUILD_TYPE=Release";
	cmdConfig+=" -DCMAKE_INSTALL_PREFIX="+Shell.realPath(Shell.getcwd())+"\\temp\\output";
	cmdConfig+=" -DBUILD_SHARED_LIBS=OFF";

	if (Fabricare.isDynamic()) {
		cmdConfig += " -DBUILD_SHARED_LIBS=OFF";
		cmdConfig += " -DWIN32_MT_BUILD=OFF";
	};

	if (Fabricare.isStatic()) {
		cmdConfig += " -DBUILD_SHARED_LIBS=OFF";
		cmdConfig += " -DWIN32_MT_BUILD=ON";
	};

	runInPath("temp/cmake",function(){
		exitIf(Shell.system(cmdConfig));
	});

	runInPath("temp/cmake",function(){
		if (Fabricare.isStatic()) {
			Shell.filePutContents("build.ninja",Shell.fileGetContents("build.ninja").replace("/W3 /GR /EHsc /MD","/W3 /GR /EHsc /MT"));
		};
	});

	Shell.filePutContents("temp/build.config.flag", "done");
};

runInPath("temp/cmake",function(){
	exitIf(Shell.system("ninja"));
	exitIf(Shell.system("ninja install"));
});

Shell.copyDirRecursively("temp/output", "output/include/prlib");
Shell.copyFile("temp/cmake/prlib.lib","output/lib/prlib.lib");

runInPath("temp/cmake",function(){
	exitIf(Shell.system("ninja clean"));
});

Shell.filePutContents("temp/build.done.flag", "done");

