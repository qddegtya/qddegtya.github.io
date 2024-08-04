source "https://rubygems.org"

gem "github-pages", group: :jekyll_plugins
gem "jekyll-include-cache", group: :jekyll_plugins

gem "webrick", "~> 1.8"

group :jekyll_plugins do
  gem "jekyll-archives"
end

if Gem::Version.new(RUBY_VERSION) >= Gem::Version.new('3.3')
  s.add_dependency("csv", "~> 3.0")
end
