from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="gitgutter-gui",
    version="1.0.0",
    author="GitGutter Team",
    author_email="contact@gitgutter.com",
    description="A modern web-based interface for searching code across GitHub repositories",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/gitgutter-gui",
    packages=find_packages(),
    include_package_data=True,
    package_data={
        '': ['templates/*', 'static/*', 'static/*/*'],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Internet :: WWW/HTTP :: Dynamic Content",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
        "Topic :: Software Development :: User Interfaces",
    ],
    python_requires=">=3.6",
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "gitgutter-gui=app:main",
        ],
    },
    keywords="github, code, search, web, gui, flask, api, development",
    project_urls={
        "Bug Reports": "https://github.com/yourusername/gitgutter-gui/issues",
        "Source": "https://github.com/yourusername/gitgutter-gui",
        "Documentation": "https://github.com/yourusername/gitgutter-gui#readme",
    },
) 